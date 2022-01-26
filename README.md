# Udonite-Server  
  
別途公開している非P2P型ユドナリウム Udoniteのサーバプログラム  
  
## 環境  
  
* サーバー  
linux（開発環境はCentOS7.9）  
最低でもVPS環境。レンタルサーバーではnodejsを稼働させられないため利用できません  
* nodejs  
(開発環境はv16.13)  
リアルタイムでデータ同期させるsocket.ioのため必須  
* mongodb  
(開発環境はv5.0.5)  
データ収納先  
必須  
* webサーバ  
(開発環境はnginx)  
画像や音楽の共有に使用   
   
## webで利用するURI  
  
* (公開するFQDN)/socket.io/  
サーバとの通信は原則これを使います。  
* (公開するFQDN)/_image  
画像データアップロード用  
* (公開するFQDN)/_audio  
音楽データアップロード用  
* (公開するFQDN)/_allData  
初回ゲームデータ取得用  
  
## 初期セットアップ手順  
  
## コンフィグの説明  
server:  
  port: 8000  ← サーバがlistenするポート 0.0.0.0：portでlistenします  
  url: 'https://localhost.example' ← CORSで認証するためのURL。ユーザーがクライアントにアクセスするためのURLを記載  
db:  
  ip: '127.0.0.1' ← mongodbにアクセスするためのIP  
  port: 27017 ← もしmongodbのポートに変更があればここも変える  
storage:  
  imageDataPath: '/localdata/image/'  ← Udonite-Serverが画像データを保存する先。実行ユーザーに書き込み権限が必要  
  imageUrlPath: 'https://localhost.example/image/'  ← ユーザーがimageDataPathにアクセスするためのURL  
  imageStorageMaxSize: 10  #MByte   ← 1部屋あたりの画像データ上限  
  audioDataPath: '/localdata/audio/'  ← Udonite-Serverが音楽データを保存する先。実行ユーザーに書き込み権限が必要  
  audioUrlPath: 'https://localhost.example/audio/'  ← ユーザーがaudioDataPathにアクセスするためのURL  
  audioStorageMaxSize: 50  #MByte  ← 1部屋あたりの音楽データ上限  
setting:   
  adminPassword: 'yourOwnPassword' ← サーバ設置者がルームを強制削除するためのパスワード  
  maxRoomCount: 10 ← 最大ルーム数  
   
