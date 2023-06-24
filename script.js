const { Player } = TextAliveApp;

let currentIndex = 0;
const songList = [
    {
        url: "https://piapro.jp/t/RoPB/20220122172830",
        mainColor: "#c33c68",
        subColor: "#76dddb",
    },
    {
        url: "https://piapro.jp/t/9cSd/20220205030039",
        mainColor: "#00208D",
        subColor: "#00208D",
    },
    {
        url: "https://piapro.jp/t/Yvi-/20220207132910",
        mainColor: "#b2cbe4",
        subColor: "#fd7e50",
    },
    {
        url: "https://piapro.jp/t/ehtN/20220207101534",
        mainColor: "#c33c68",
        subColor: "#76dddb",
    },
    {
        url: "https://piapro.jp/t/QtjE/20220207164031",
        mainColor: "#c33c68",
        subColor: "#76dddb",
    },
    {
        url: "https://piapro.jp/t/GqT2/20220129182012",
        mainColor: "#c33c68",
        subColor: "#76dddb",
    },
];

// TextAlive Player を初期化
const player = new Player({
    app: {
        token: "JY0mLoHiX3lPTJaS",
        parameters: [],
    },
    mediaElement: document.querySelector("#media"),
    mediaBannerPosition: "bottom right",

    // オプション一覧
    // https://developer.textalive.jp/packages/textalive-app-api/interfaces/playeroptions.html
});

const overlay = document.querySelector("#overlay");
const bar = document.querySelector("#bar");
const textContainer = document.querySelector("#text");
const seekbar = document.querySelector("#seekbar");
const paintedSeekbar = seekbar.querySelector("div");
let b, c;

player.addListener({
    /* APIの準備ができたら呼ばれる */
    onAppReady(app) {
        if (app.managed) {
            document.querySelector("#control").className = "disabled";
        }
        if (!app.songUrl) {
            document.querySelector("#media").className = "disabled";

            player.createFromSongUrl(songList[currentIndex].url);
            document.querySelector(
                "body"
            ).style.backgroundImage = `linear-gradient(0deg, ${songList[currentIndex].mainColor} 0%, ${songList[currentIndex].subColor} 100%)`;
            // player.createFromSongUrl("https://piapro.jp/t/9cSd/20220205030039");
            // player.createFromSongUrl("https://piapro.jp/t/Yvi-/20220207132910");
            // player.createFromSongUrl("https://piapro.jp/t/ehtN/20220207101534");
            // player.createFromSongUrl("https://piapro.jp/t/QtjE/20220207164031");
            // player.createFromSongUrl("https://piapro.jp/t/GqT2/20220129182012");
        }
    },

    /* パラメタが更新されたら呼ばれる */
    onAppParameterUpdate: () => {
        const params = player.app.options.parameters;
        const sc = player.app.parameters.gradationStartColor,
            scString = sc
                ? `rgb(${sc.r}, ${sc.g}, ${sc.b})`
                : params[0].initialValue;
        const ec = player.app.parameters.gradationEndColor,
            ecString = ec
                ? `rgb(${ec.r}, ${ec.g}, ${ec.b})`
                : params[1].initialValue;
        document.body.style.backgroundColor = ecString;
        document.body.style.backgroundImage = `linear-gradient(0deg, ${ecString} 0%, ${scString} 100%)`;
    },

    /* 楽曲が変わったら呼ばれる */
    onAppMediaChange() {
        // 画面表示をリセット
        overlay.className = "";
        bar.className = "";
        resetChars();
    },

    /* 楽曲情報が取れたら呼ばれる */
    onVideoReady(video) {
        // 楽曲情報を表示
        document.querySelector("#artist span").textContent =
            player.data.song.artist.name;
        document.querySelector("#song span").textContent =
            player.data.song.name;

        // 最後に表示した文字の情報をリセット
        c = null;
    },

    /* 再生コントロールができるようになったら呼ばれる */
    onTimerReady() {
        overlay.className = "disabled";
        document.querySelector("#control > a#play").className = "";
        document.querySelector("#control > a#stop").className = "";
    },

    /* 再生位置の情報が更新されたら呼ばれる */
    onTimeUpdate(position) {
        // シークバーの表示を更新
        paintedSeekbar.style.width = `${
            parseInt((position * 1000) / player.video.duration) / 10
        }%`;

        // 現在のビート情報を取得
        let beat = player.findBeat(position);
        if (b !== beat) {
            if (beat) {
                requestAnimationFrame(() => {
                    bar.className = "active";
                    requestAnimationFrame(() => {
                        bar.className = "active beat";
                    });
                });
            }
            b = beat;
        }

        // 歌詞情報がなければこれで処理を終わる
        if (!player.video.firstChar) {
            return;
        }

        // 巻き戻っていたら歌詞表示をリセットする
        if (c && c.startTime > position + 1000) {
            resetChars();
        }

        // 500ms先に発声される文字を取得
        let current = c || player.video.firstChar;
        while (current && current.startTime < position + 500) {
            // 新しい文字が発声されようとしている
            if (c !== current) {
                newChar(current);
                c = current;
            }
            current = current.next;
        }
    },

    /* 楽曲の再生が始まったら呼ばれる */
    onPlay() {
        const a = document.querySelector("#control > a#play");
        while (a.firstChild) a.removeChild(a.firstChild);
        a.appendChild(document.createTextNode("\uf28b"));
    },

    /* 楽曲の再生が止まったら呼ばれる */
    onPause() {
        const a = document.querySelector("#control > a#play");
        while (a.firstChild) a.removeChild(a.firstChild);
        a.appendChild(document.createTextNode("\uf144"));
    },
});

/* 再生・一時停止ボタン */
document.querySelector("#control > a#play").addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        if (player.isPlaying) {
            player.requestPause();
        } else {
            player.requestPlay();
        }
    }
    return false;
});

/* 停止ボタン */
document.querySelector("#control > a#stop").addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        player.requestStop();

        // 再生を停止したら画面表示をリセットする
        bar.className = "";
        resetChars();
    }
    return false;
});

/* シークバー */
seekbar.addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        player.requestMediaSeek(
            (player.video.duration * e.offsetX) / seekbar.clientWidth
        );
    }
    return false;
});

/**
 * 新しい文字の発声時に呼ばれる
 * Called when a new character is being vocalized
 */
function newChar(current) {
    // 品詞 (part-of-speech)
    // https://developer.textalive.jp/packages/textalive-app-api/interfaces/iword.html#pos
    const classes = [];
    if (
        current.parent.pos === "N" ||
        current.parent.pos === "PN" ||
        current.parent.pos === "X"
    ) {
        classes.push("noun");
    }

    if (current.parent.parent.firstChar === current) {
        textContainer.innerHTML = "";
    }

    // フレーズの最後の文字か否か
    if (current.parent.parent.lastChar === current) {
        classes.push("lastChar");
    }

    // 英単語の最初か最後の文字か否か
    if (current.parent.language === "en") {
        if (current.parent.lastChar === current) {
            classes.push("lastCharInEnglishWord");
        } else if (current.parent.firstChar === current) {
            classes.push("firstCharInEnglishWord");
        }
    }

    // noun, lastChar クラスを必要に応じて追加
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(current.text));

    // 文字を画面上に追加
    const container = document.createElement("div");
    container.className = classes.join(" ");
    container.appendChild(div);
    container.addEventListener("click", () => {
        // 時間指定で飛ぶ。(単語が再生される時間)
        player.requestMediaSeek(current.startTime);
    });
    textContainer.appendChild(container);
}

/**
 * 歌詞表示をリセットする
 * Reset lyrics view
 */
function resetChars() {
    c = null;
    while (textContainer.firstChild)
        textContainer.removeChild(textContainer.firstChild);
}

document.getElementById("menu").addEventListener("change", function (event) {
    resetChars();
    currentIndex = event.target.value;
    player.createFromSongUrl(songList[currentIndex].url);
    document.querySelector(
        "body"
    ).style.backgroundImage = `linear-gradient(0deg, ${songList[currentIndex].mainColor} 0%, ${songList[currentIndex].subColor} 100%)`;
});

let count = 0;
document.getElementById("fontBtn").addEventListener("click", () => {
    let fontList = ["Hachi Maru Pop", "Noto Sans JP", "Noto Serif JP"];
    document.getElementById("text").style.fontFamily = fontList[count];

    count = (count + 1) % fontList.length;
});

document.getElementById("search").addEventListener("input", (e) => {
    const searchWord = e.target.value;

    const suggest = document.getElementById("suggest");
    suggest.innerHTML = "";

    const phrases = player.video.phrases.filter((phrase) => {
        return searchWord && phrase.text.indexOf(searchWord) > -1;
    });

    for (const phrase of phrases) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        const text = document.createElement("span");
        const time = document.createElement("span");

        text.classList.add("text");
        time.classList.add("time");
        text.innerText = phrase.text;

        const startTimeSecond = Math.floor(phrase.startTime / 1000);
        time.innerText = `${("00" + Math.floor(startTimeSecond / 60)).slice(
            -2
        )}:${("00" + (startTimeSecond % 60)).slice(-2)}`;

        a.addEventListener("click", () => {
            // 時間指定で飛ぶ。(単語が再生される時間)
            player.requestMediaSeek(phrase.startTime - 300);
            suggest.innerHTML = "";
        });

        a.appendChild(text);
        a.appendChild(time);
        li.appendChild(a);
        suggest.appendChild(li);
    }
});
function newWord(current) {
    // 品詞 (part-of-speech)
    // https://developer.textalive.jp/packages/textalive-app-api/interfaces/iword.html#pos
    const classes = [];
    if (current.pos === "N" || current.pos === "PN" || current.pos === "X") {
        classes.push("noun");
    }

    // フレーズの最後の文字か否か
    if (current.parent.lastChar === current) {
        classes.push("lastChar");
    }

    // フレーズの最初で#textの中身をからにする
    if (current.parent.firstChar === current.firstChar) {
        document.getElementById("text").innerHTML = "";
    }

    // 英単語の最初か最後の文字か否か
    if (current.language === "en") {
        if (current.lastChar === current) {
            classes.push("lastCharInEnglishWord");
        } else if (current.firstChar === current) {
            classes.push("firstCharInEnglishWord");
        }
    }
    // noun, lastChar クラスを必要に応じて追加
    const div = document.createElement("div");
    // data-text = "xxx"
    div.dataset.text = current.text;
    const randNum = Math.floor(Math.random() * 500) - 250;
    if (randNum < 0) {
        div.style.paddingBottom = `${Math.abs(randNum)}px`;
    } else {
        div.style.paddingTop = `${randNum}px`;
    }
    div.appendChild(document.createTextNode(current.text));

    // 文字を画面上に追加
    const container = document.createElement("div");
    container.className = classes.join(" ");
    container.appendChild(div);
    container.addEventListener("click", () => {
        player.requestMediaSeek(current.startTime);
    });
    textContainer.appendChild(container);
}

