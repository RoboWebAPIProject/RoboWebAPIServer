# 基本コンセプト

https://github.com/RoboWebAPIProject/RoboWebAPIServer/wiki/%E5%9F%BA%E6%9C%AC%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88


# セットアップ

1. ダウンロード

 git clone https://github.com/RoboWebAPIProject/RoboWebAPIServer.git

2. 依存ファイルのインストール

 npm install

3. 設定ファイルの編集

 config/default.json を編集


  {
   "mqtt_host": "*** MQTT サーバーのホスト名 ***",
   
   "mqtt_port" : *** MQTT サーバー接続ポート番号 ***,
   
   "mqtt_username" : "MQTT サーバー接続ユーザーID サーバー用",
   
   "mqtt_password" : "MQTT サーバー接続パスワード サーバー用",
   
   "mqtt_username_for_client" : "MQTT サーバー接続ユーザーID クライアント用",
   
   "mqtt_password_for_client" : "MQTT サーバー接続パスワード クライアント用",
   
   "request_timeout_ms" : 10000, // リクエストタイムアウト時間
   
   "client_token_length" : 8  // クライアントトークンの長さ
   
  }

4. 実行

 node roboWebAPI.js 


# テストサーバー

http://api.robowebapi.org:8081

#テストページ

http://api.robowebapi.org/test/test.html

