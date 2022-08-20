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
* webサーバ または オブジェクトストレージ(試験実装)
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
  
Udonite-Server自身の設置フォルダはWEBで公開しないでください  
  
ファイルの準備  
 $git clone https://github.com/Mafty-Hs/Udonite-Server  
 $cd Udonite-Server  
 $npm install  
 $cp config/default.yaml.template config/default.yaml  
  
画像・音楽データ公開フォルダの作成  
  
 $ mkdir /vaw/www/html/image  
 $ mkdir /vaw/www/html/audio  
  
 パスは各自の環境にあわせ変更してください。  
 また、Udonite-Server実行ユーザーが上記のフォルダに書き込めるように権限を付与してください  
 またWebで上記フォルダに直接アクセスできるように設定します 
 オブジェクトストレージを使用する際にはs3clientconfig.jsonに設定を記載してください 
  
configの設定  
 詳細は後述  
  
実行  
  $npm start

## コンフィグの説明  
server:  
  port: 8000  ← サーバがlistenするポート 0.0.0.0：portでlistenします  
  url: 'https://localhost.example' ← CORSで認証するためのURL。ユーザーがクライアントにアクセスするためのURLを記載  
db:  
  ip: '127.0.0.1' ← mongodbにアクセスするためのIPまたはFQDN  
  port: 27017 ← もしmongodbのポートに変更があればここも変える
  user: '' ← mongodbに接続するためのユーザー(あれば) 
  password: ''　← mongodbに接続するためのパスワード(あれば)    
storage:  
  storageType: 1 # 1:LocalStorage 2: ObjectStorage  ← 使用するストレージ  
  s3BucketName: ''  ← オブジェクトストレージを使用する際のバケット名  
  s3UrlPath: ''  ← オブジェクトストレージが外部へファイルを公開するときのURL  
  imageDataPath: '/localdata/image/'  ← Udonite-Serverが画像データを保存する先。実行ユーザーに書き込み権限が必要  
  imageUrlPath: 'https://localhost.example/image/'  ← ユーザーがimageDataPathにアクセスするためのURL  
  imageStorageMaxSize: 10  #MByte   ← 1部屋あたりの画像データ上限  
  audioDataPath: '/localdata/audio/'  ← Udonite-Serverが音楽データを保存する先。実行ユーザーに書き込み権限が必要  
  audioUrlPath: 'https://localhost.example/audio/'  ← ユーザーがaudioDataPathにアクセスするためのURL  
  audioStorageMaxSize: 50  #MByte  ← 1部屋あたりの音楽データ上限  
setting:   
  adminPassword: 'yourOwnPassword' ← サーバ設置者がルームを強制削除するためのパスワード  
  maxRoomCount: 10 ← 最大ルーム数  
  roomPerPage: 10 ← 1ページあたりに表示するルーム数  
log:  
  filePath: './log/udonite.log' ← ログの保存先    
   
