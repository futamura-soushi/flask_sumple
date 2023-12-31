const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: 'b4a3adf1-e60d-4019-91f8-8adffdd552c0',
      turn: true,
      actions: ['read'],
      channels: [
        {
          id: '*',
          name: '*',
          actions: ['write'],
          members: [
            {
              id: '*',
              name: '*',
              actions: ['write'],
              publication: {
                actions: ['write'],
              },
              subscription: {
                actions: ['write'],
              },
            },
          ],
          sfuBots: [
            {
              actions: ['write'],
              forwardings: [
                {
                  actions: ['write'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode('BHgTmZ5Z85jpptlPXD8kW5JDQk4jo66dWWmMlJwNoQU=');

(async () => {
  const localVideo = document.getElementById('local-video');
  const buttonArea = document.getElementById('button-area');
  const remoteMediaArea = document.getElementById('remote-media-area');
  const roomNameInput = document.getElementById('room-name');

  const myId = document.getElementById('my-id');
  const joinButton = document.getElementById('join');

  if (navigator.userAgentData && navigator.userAgentData.mobile) {
    const environmentConstraints = {video: {facingMode: {exact: "environment"}}};
     var { audio, video } =
    await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream(environmentConstraints);
  } else {
     var { audio, video } =
    await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
    console.log(navigator.userAgentData.mobile);
  }
  
  video.attach(localVideo);
  //await localVideo.play();

  joinButton.onclick = async () => {
    if (roomNameInput.value === '') return;

    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: 'sfu',
      name: roomNameInput.value,
    });
    const me = await room.join();

    myId.textContent = me.id;

    //await me.publish(audio);
    await me.publish(video);

    const subscribeAndAttach = (publication) => {
      if (publication.publisher.id === me.id) return;

      const subscribeButton = document.createElement('button');
      subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
      buttonArea.appendChild(subscribeButton);

      subscribeButton.onclick = async () => {
        const { stream } = await me.subscribe(publication.id);

        let newMedia;
        switch (stream.track.kind) {
          case 'video':
            newMedia = document.createElement('video');
            newMedia.playsInline = true;
            newMedia.autoplay = true;
            newMedia.width = 1000;
            break;
          case 'audio':
            newMedia = document.createElement('audio');
            newMedia.controls = true;
            newMedia.autoplay = true;
            break;
          default:
            return;
        }
        stream.attach(newMedia);
        remoteMediaArea.appendChild(newMedia);
      };
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  };
})();

//テスト
/*const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

//SkyWay Auth Tokenの作成
const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
      app: {
        id: 'b4a3adf1-e60d-4019-91f8-8adffdd552c0', //アプリケーションID
        turn: true,
        actions: ['read'],
        channels: [
          {
            id: '*',
            name: '*',
            actions: ['write'],
            members: [
              {
                id: '*',
                name: '*',
                actions: ['write'],
                publication: {
                  actions: ['write'],
                },
                subscription: {
                  actions: ['write'],
                },
              },
            ],
            sfuBots: [
              {
                actions: ['write'],
                forwardings: [
                  {
                    actions: ['write'],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }).encode('BHgTmZ5Z85jpptlPXD8kW5JDQk4jo66dWWmMlJwNoQU=');  //シークレットキー

  
  //カメラ映像、マイク音声の取得
  (async () => {
    // 1
    const localVideo = document.getElementById('local-video');
    const buttonArea = document.getElementById('button-area');
    const remoteMediaArea = document.getElementById('remote-media-area');
    const roomNameInput = document.getElementById('room-name');

    const myId = document.getElementById('my-id');
    const joinButton = document.getElementById('join');

    if (navigator.userAgent.match(/iPhone|Android.+Mobile/)){
    const environmentConstraints = {video: {facingMode: {exact: "environment"}}}; //背面カメラ？
  
    const { video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream(environmentConstraints); // 2
    }else{
    const { video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream(); // 2
    }
    video.attach(localVideo); // 3
    await localVideo.play(); // 4

    joinButton.onclick = async () => {
      if (roomNameInput.value === '') return;
    
      const context = await SkyWayContext.Create(token);
      const room = await SkyWayRoom.FindOrCreate(context, {
        type: 'sfu',  //p2pまたはsfu
        name: roomNameInput.value,
      });
      //roomに入室
      const me = await room.join();

      myId.textContent = me.id;

       //自分の映像と音声を配信する  publish関数
      await me.publish(video);

      //相手の映像と音声をsubscribeする
      const subscribeAndAttach = (publication) => {
        // 3 subscribeAndAttach関数の作成　引数はpublication　このpublicationが自分がpublishしたものでない場合に以降の処理を実行
        if (publication.publisher.id === me.id) return;
      
        const subscribeButton = document.createElement('button'); // 3-1 publisher.idとpublicationのcontentTypeをラベルにしたボタンをボタンエリアに追加
        subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
        buttonArea.appendChild(subscribeButton);
      
        subscribeButton.onclick = async () => {
          // 3-2 3.1で作成したボタンが押されたときに実行する処理の作成
          const { stream } = await me.subscribe(publication.id); // 3-2-1 publicationをsubscribeするとstreamが返却
      
          let newMedia; // 3-2-2　newMedia という名前の変数を作成し、　stream.track.kind が video であれば video 要素を、audio であれば audio 要素を作成し、それぞれ適切な属性を設定する。
          switch (stream.track.kind) {
            case 'video':
              newMedia = document.createElement('video');
              newMedia.playsInline = true;
              newMedia.autoplay = true;
              break;
            default:
              return;
          }
          stream.attach(newMedia); // 3-2-3 streamをnewmediaにセットし、その後remoteMedeiaAreaを追加
          remoteMediaArea.appendChild(newMedia);
        };
      };  

    
    

    room.publications.forEach(subscribeAndAttach); // 1 roomのpublicationsプロパティに、roomに存在するpublicationの配列が格納されている。この配列の各要素を、subscribeAndAttach関数の引数に与えている。
  
    room.onStreamPublished.add((e) => {
      // 2 add関数の引数にコールバック関数を渡すと、そのroom内で誰かがpublishされた時点でコールバックが実行される.
      subscribeAndAttach(e.publication);
    });
   
  };
  })(); // 1*/



  















  /*
  //HTML要素の取得
  const buttonArea = document.getElementById('button-area');
  const remoteMediaArea = document.getElementById('remote-media-area');
  const roomNameInput = document.getElementById('room-name');
  const myId = document.getElementById('my-id');
  const joinButton = document.getElementById('join');

  joinButton.onclick = async () => {
    if (roomNameInput.value === '') return;
  
    const context = await SkyWayContext.Create(token);
  };

  // SkywayRoom.FindOrCreate もしすでに同じnameのroomが存在しなければ作成し、存在すればそのroomを取得する関数
  const room = await SkyWayRoom.FindOrCreate(context, {
    type: 'sfu',  //p2pまたはsfu
    name: roomNameInput.value,
  });

  //roomに入室
  const me = await room.join();

  myId.textContent = me.id;

  //自分の映像と音声を配信する  publish関数
  await me.publish(audio);
  await me.publish(video);

  //相手の映像と音声をsubscribeする
  const subscribeAndAttach = (publication) => {
    // 3 subscribeAndAttach関数の作成　引数はpublication　このpublicationが自分がpublishしたものでない場合に以降の処理を実行
    if (publication.publisher.id === me.id) return;
  
    const subscribeButton = document.createElement('button'); // 3-1 publisher.idとpublicationのcontentTypeをラベルにしたボタンをボタンエリアに追加
    subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
  
    buttonArea.appendChild(subscribeButton);
  
    subscribeButton.onclick = async () => {
      // 3-2 3.1で作成したボタンが押されたときに実行する処理の作成
      const { stream } = await me.subscribe(publication.id); // 3-2-1 publicationをsubscribeするとstreamが返却
  
      let newMedia; // 3-2-2　newMedia という名前の変数を作成し、　stream.track.kind が video であれば video 要素を、audio であれば audio 要素を作成し、それぞれ適切な属性を設定する。
      switch (stream.track.kind) {
        case 'video':
          newMedia = document.createElement('video');
          newMedia.playsInline = true;
          newMedia.autoplay = true;
          break;
        case 'audio':
          newMedia = document.createElement('audio');
          newMedia.controls = true;
          newMedia.autoplay = true;
          break;
        default:
          return;
      }
      stream.attach(newMedia); // 3-2-3 streamをnewmediaにセットし、その後remoteMedeiaAreaを追加
      remoteMediaArea.appendChild(newMedia);
    };
  };
  
  room.publications.forEach(subscribeAndAttach); // 1 roomのpublicationsプロパティに、roomに存在するpublicationの配列が格納されている。この配列の各要素を、subscribeAndAttach関数の引数に与えている。
  
  room.onStreamPublished.add((e) => {
    // 2 add関数の引数にコールバック関数を渡すと、そのroom内で誰かがpublishされた時点でコールバックが実行される.
    subscribeAndAttach(e.publication);
  });
  */