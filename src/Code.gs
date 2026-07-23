/**
 * 名探偵！かずのひみつ  ―  サーバーサイド（Google Apps Script）
 *
 * 役割:
 *   - Web アプリの配信（HTML Service）
 *   - Google スプレッドシートをバックエンドにした保存・読み込み
 *       problems      … 児童が作った問題
 *       group_scores  … グループ対抗のスコア
 *       progress      … 児童ごとの解禁カテゴリ・バッジ
 *       config        … 教員が設定する単元フェーズなど
 *
 * 設計方針:
 *   - フロント側だけでもゲームが成立するよう、通信は「保存/共有」に限定。
 *   - シートが無ければ自動作成（初回に setup() を実行しなくても動く）。
 */

/** シート名の定義（1か所にまとめて保守しやすく） */
var SHEETS = {
  PROBLEMS: 'problems',
  SCORES: 'group_scores',
  PROGRESS: 'progress',
  CONFIG: 'config'
};

/** 各シートのヘッダー定義 */
var HEADERS = {
  problems: ['id', 'secret', 'range', 'hints_json', 'author', 'candidates', 'created_at'],
  group_scores: ['id', 'session', 'group_name', 'score', 'hints_used', 'time_sec', 'created_at'],
  progress: ['student', 'unlocked_json', 'badges', 'rank', 'updated_at'],
  config: ['key', 'value']
};

/** Web アプリのエントリーポイント */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('名探偵！かずのひみつ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** HTML 内で他ファイルを読み込むためのヘルパー（<?!= include('styles') ?>） */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ============================================================
 *  スプレッドシート ユーティリティ
 * ============================================================ */

/** アクティブなスプレッドシートを取得（無ければ作成してプロパティに保存） */
function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      // 保存済み ID が無効なら作り直す
    }
  }
  // コンテナバインドされていれば active を使う
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }
  // スタンドアロン運用: 専用スプレッドシートを新規作成
  var ss = SpreadsheetApp.create('名探偵かずのひみつ_データ');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

/** 指定シートを取得。無ければヘッダー付きで作成する */
function getSheet_(name) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var header = HEADERS[name];
    if (header) {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/** シートを行オブジェクトの配列として読み込む */
function readRows_(name) {
  var sheet = getSheet_(name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var c = 0; c < header.length; c++) {
      obj[header[c]] = values[i][c];
    }
    rows.push(obj);
  }
  return rows;
}

/** 初期セットアップ（手動実行用・任意） */
function setup() {
  Object.keys(SHEETS).forEach(function (k) {
    getSheet_(SHEETS[k]);
  });
  return '初期セットアップ完了';
}

/** 一意な ID を生成 */
function newId_() {
  return Utilities.getUuid().slice(0, 8);
}

/* ============================================================
 *  config（単元フェーズなどの教員設定）
 * ============================================================ */

/** 設定値をまとめて取得。未設定ならデフォルトを返す */
function getConfig() {
  var rows = readRows_(SHEETS.CONFIG);
  var map = {};
  rows.forEach(function (r) { map[r.key] = r.value; });
  return {
    phase: map.phase ? Number(map.phase) : 1,     // 現在の単元フェーズ 1〜6
    groupSession: map.groupSession || ''          // グループ対抗の現在セッション名
  };
}

/** 設定値を1件保存（教員用） */
function setConfig(key, value) {
  var sheet = getSheet_(SHEETS.CONFIG);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return getConfig();
    }
  }
  sheet.appendRow([key, value]);
  return getConfig();
}

/* ============================================================
 *  problems（作問モード）
 * ============================================================ */

/** 問題を保存する。problem = {secret, range, hints, author, candidates} */
function saveProblem(problem) {
  var sheet = getSheet_(SHEETS.PROBLEMS);
  var id = newId_();
  sheet.appendRow([
    id,
    problem.secret,
    problem.range,
    JSON.stringify(problem.hints || []),
    problem.author || 'ななし探偵',
    problem.candidates || 1,
    new Date()
  ]);
  return id;
}

/** みんなの問題一覧を取得（新しい順・最大 limit 件） */
function listProblems(limit) {
  var rows = readRows_(SHEETS.PROBLEMS);
  var out = rows.map(function (r) {
    var hints = [];
    try { hints = JSON.parse(r.hints_json || '[]'); } catch (e) {}
    return {
      id: r.id,
      secret: Number(r.secret),
      range: Number(r.range),
      hints: hints,
      author: r.author,
      candidates: Number(r.candidates),
      createdAt: r.created_at
    };
  });
  out.reverse();
  if (limit) out = out.slice(0, limit);
  return out;
}

/* ============================================================
 *  group_scores（グループ対抗）
 * ============================================================ */

/** スコアを1件記録する */
function saveScore(entry) {
  var sheet = getSheet_(SHEETS.SCORES);
  sheet.appendRow([
    newId_(),
    entry.session || getConfig().groupSession || 'session1',
    entry.groupName || 'グループ',
    entry.score || 0,
    entry.hintsUsed || 0,
    entry.timeSec || 0,
    new Date()
  ]);
  return true;
}

/** スコアボードを取得。session を指定するとその回のみ集計 */
function listScores(session) {
  var rows = readRows_(SHEETS.SCORES);
  var filtered = rows.filter(function (r) {
    return !session || String(r.session) === String(session);
  });
  // グループごとに合計得点を集計
  var byGroup = {};
  filtered.forEach(function (r) {
    var g = r.group_name;
    if (!byGroup[g]) byGroup[g] = { groupName: g, score: 0, hintsUsed: 0, plays: 0 };
    byGroup[g].score += Number(r.score) || 0;
    byGroup[g].hintsUsed += Number(r.hints_used) || 0;
    byGroup[g].plays += 1;
  });
  var board = Object.keys(byGroup).map(function (k) { return byGroup[k]; });
  board.sort(function (a, b) { return b.score - a.score; });
  return board;
}

/* ============================================================
 *  progress（児童ごとの進捗）
 * ============================================================ */

/** 進捗を保存（student をキーに upsert） */
function saveProgress(p) {
  var sheet = getSheet_(SHEETS.PROGRESS);
  var values = sheet.getDataRange().getValues();
  var row = [
    p.student || 'ゲスト探偵',
    JSON.stringify(p.unlocked || []),
    p.badges || 0,
    p.rank || '見習い探偵',
    new Date()
  ];
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === row[0]) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return true;
    }
  }
  sheet.appendRow(row);
  return true;
}

/** 進捗を取得 */
function getProgress(student) {
  var rows = readRows_(SHEETS.PROGRESS);
  var found = null;
  rows.forEach(function (r) {
    if (r.student === student) found = r;
  });
  if (!found) return null;
  var unlocked = [];
  try { unlocked = JSON.parse(found.unlocked_json || '[]'); } catch (e) {}
  return {
    student: found.student,
    unlocked: unlocked,
    badges: Number(found.badges) || 0,
    rank: found.rank
  };
}
