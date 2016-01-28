# RoboWebAPIProject

■ 概要：

Robot のコントロールを Web API を介して行うプロジェクトです
サーバーとロボットは MQTT などで常時接続し、サーバーにリクエストを送ることで、Web API を介してロボットをコントロールします

例１：
　http://robowebapiサーバー/call/クライアントトークン?module=ALTextToSpeech&method=say&param=こんにちは
　
　識別子 "クライアントトークン" でつながっているロボット(Pepper) に「こんにちは」と喋らせる
　
例２：
　http://robowebapiサーバー/addWebhook/クライアントトークン?key=MiddleTactilTouched&url=http://myserver.com
　
　イベント "MiddleTactilTouched" がロボットで発生した時 http://myserver.com が呼ばれるように登録。イベントの内容は POST リクエストの ボディーに JSON 形式で通知されます。


■ サーバーの起動(node.js)

 node roboWebAPI

■ クライアントの起動

クライアント(ロボット)は現状 Pepper をサポートしています。基本、Pepper の ロボアプリ API、NAOqi の全ての API にアクセスできます。
Pepper 上ではクライアントアプリ RoboWebAPIClient アプリを起動し、サーバーに接続します。
　

