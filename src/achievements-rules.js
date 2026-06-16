// AUTO-GENERATED achievement rules. 37 live achievements.
// fields: id, universe(UC/SEED/W/X/G/00/BF/other), no(1-based per universe), group, name, sub, hidden, scope?, rule
export const ACHIEVEMENTS = [
  {
    "id": "trinity_x3",
    "universe": "UC",
    "no": 1,
    "group": "combo",
    "name": "三倍の流儀",
    "sub": "通常の3倍を3度繰り返す男。色だけ赤くて性能3割増(当社比)。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-06"
          }
        },
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MSM-07"
          }
        },
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-14"
          }
        }
      ]
    }
  },
  {
    "id": "casval_faces",
    "universe": "UC",
    "no": 2,
    "group": "combo",
    "name": "キャスバルの七つの顔",
    "sub": "名前を変えても中身は同じ。エドワウもクワトロも、結局あなたの棚の住人。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-06"
          }
        },
        {
          "match": {
            "nameIncludes": "百式"
          }
        },
        {
          "match": {
            "nameIncludes": "サザビー"
          }
        }
      ]
    }
  },
  {
    "id": "see_perf",
    "universe": "UC",
    "no": 3,
    "group": "combo",
    "name": "見せてもらおうか",
    "sub": "「連邦のMSの性能とやらを!」永遠のライバル、同じ段に仲良く整列。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-06"
          }
        },
        {
          "match": {
            "code": "RX-78-2"
          }
        }
      ]
    }
  },
  {
    "id": "axis_shock",
    "universe": "UC",
    "no": 4,
    "group": "combo",
    "name": "アクシズ・ショック",
    "sub": "サイコフレーム共振中。本棚がアクシズを押し返している。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "code": "RX-93"
          }
        },
        {
          "match": {
            "nameIncludes": "サザビー"
          }
        }
      ]
    }
  },
  {
    "id": "guf_diff",
    "universe": "UC",
    "no": 5,
    "group": "combo",
    "name": "ザクとは違うのだよ",
    "sub": "「ザクとは違うのだよ、ザクとは!」並べると正直、違いが分からない。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "グフ",
            "nameExcludes": "プロトタイプ"
          }
        },
        {
          "match": {
            "codePrefix": "MS-06",
            "nameIncludes": "ザク"
          }
        }
      ]
    }
  },
  {
    "id": "numbers",
    "universe": "UC",
    "no": 6,
    "group": "count",
    "name": "戦いは数だよ兄貴",
    "sub": "緑が増えるほど画面が緑になる。数こそ正義。",
    "hidden": false,
    "rule": {
      "count": {
        "codePrefix": "MS-06",
        "nameIncludes": "ザク"
      },
      "gte": 3
    }
  },
  {
    "id": "last_shoot",
    "universe": "UC",
    "no": 7,
    "group": "combo",
    "name": "ラスト・シューティング",
    "sub": "頭部と片腕を失っても、最後の一撃。正史の名シーン、棚で再現。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "code": "RX-78-2"
          }
        },
        {
          "match": {
            "nameIncludes": "ジオング",
            "nameExcludes": "パーフェクト"
          }
        }
      ]
    }
  },
  {
    "id": "pocket_war",
    "universe": "UC",
    "no": 8,
    "group": "combo",
    "name": "ポケットの中の戦争",
    "sub": "クリスマスは、こない。並べると毎年12月が少し切なくなる。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "NT-1"
          }
        },
        {
          "match": {
            "code": "MS-18E"
          }
        }
      ]
    }
  },
  {
    "id": "solomon",
    "universe": "UC",
    "no": 9,
    "group": "single",
    "name": "ソロモンよ、私は帰ってきた",
    "sub": "ガトーの咆哮。核は別売りどころか、撃てません。",
    "hidden": false,
    "rule": {
      "match": {
        "codePrefix": "RX-78GP02"
      }
    }
  },
  {
    "id": "stardust",
    "universe": "UC",
    "no": 10,
    "group": "combo",
    "name": "星の屑作戦",
    "sub": "デラーズ・フリート完全再現。デンドロビウムが無いだけ、平和。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "RX-78GP01"
          }
        },
        {
          "match": {
            "codePrefix": "RX-78GP02"
          }
        },
        {
          "match": {
            "codePrefix": "RX-78GP03"
          }
        }
      ]
    }
  },
  {
    "id": "toki_mieru",
    "universe": "UC",
    "no": 11,
    "group": "combo",
    "name": "刻が見える",
    "sub": "シロッコとハマーン。Zの二大黒幕。でかい機体は、時間も場所も食う。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ジ・O"
          }
        },
        {
          "match": {
            "nameIncludes": "キュベレイ"
          }
        }
      ]
    }
  },
  {
    "id": "aeug3",
    "universe": "UC",
    "no": 12,
    "group": "combo",
    "name": "エゥーゴ三羽烏",
    "sub": "カミーユ・クワトロ・アポリー、エゥーゴ精鋭ここに結成。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "Zガンダム",
            "nameExcludes": "ZZ",
            "line": "MG"
          }
        },
        {
          "match": {
            "nameIncludes": "百式"
          }
        },
        {
          "match": {
            "nameIncludes": "リック・ディアス"
          }
        }
      ]
    }
  },
  {
    "id": "jazz_nenbutsu",
    "universe": "UC",
    "no": 13,
    "group": "combo",
    "name": "ジャズと念仏",
    "sub": "義手・義足で奏でる死闘。南無阿弥陀仏。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "サイコ・ザク"
          }
        },
        {
          "match": {
            "nameIncludes": "フルアーマー・ガンダム"
          }
        }
      ]
    }
  },
  {
    "id": "f91_relax",
    "universe": "UC",
    "no": 14,
    "group": "single",
    "name": "鉄仮面の美学",
    "sub": "「シーブック、いっけぇぇ!」質量を持った残像。",
    "hidden": false,
    "rule": {
      "match": {
        "nameIncludes": "F91"
      }
    }
  },
  {
    "id": "gm_grave",
    "universe": "UC",
    "no": 15,
    "group": "count",
    "name": "ジムの墓場",
    "sub": "「やられメカ」の誇り。主役を引き立てる名もなき量産機に、献杯。",
    "hidden": false,
    "rule": {
      "count": {
        "nameIncludes": "ジム"
      },
      "gte": 5
    }
  },
  {
    "id": "oyako_don",
    "universe": "UC",
    "no": 16,
    "group": "meta",
    "name": "親子丼",
    "sub": "同じ機体を、グレード違いで親子で勢揃い。グレード違いの食卓。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "sameCodeAcrossGrades": [
        "MG",
        "HG"
      ]
    }
  },
  {
    "id": "three_grade",
    "universe": "UC",
    "no": 17,
    "group": "meta",
    "name": "三段活用",
    "sub": "親子三代。財布は静かに泣いている。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "sameCodeAcrossGrades": [
        "HG",
        "MG",
        "PG"
      ]
    }
  },
  {
    "id": "sieg_zeon",
    "universe": "UC",
    "no": 18,
    "group": "count",
    "name": "ジーク・ジオン",
    "sub": "ジーク・ジオン! 緑と紫が棚を埋め尽くす。公国に栄光あれ。",
    "hidden": false,
    "rule": {
      "count": {
        "faction": "zeon"
      },
      "gte": 20
    }
  },
  {
    "id": "x4",
    "universe": "UC",
    "no": 19,
    "group": "combo",
    "name": "通常の4倍",
    "sub": "全部赤い。性能3割増(当社比)を4機分。棚だけはアクシズ。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-06"
          }
        },
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-14"
          }
        },
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MSM-07"
          }
        },
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-09"
          }
        }
      ]
    }
  },
  {
    "id": "ral_team",
    "universe": "UC",
    "no": 20,
    "group": "combo",
    "name": "若いな、ラル隊",
    "sub": "歴戦の漢のシブさで一棚。「若いな」「だが、それがいい」。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ランバ・ラル"
          }
        },
        {
          "match": {
            "nameIncludes": "グフ",
            "nameExcludes": "プロトタイプ"
          }
        },
        {
          "match": {
            "nameIncludes": "プロトタイプグフ"
          }
        }
      ]
    }
  },
  {
    "id": "gato_cv",
    "universe": "UC",
    "no": 21,
    "group": "combo",
    "name": "英雄ガトーの履歴書",
    "sub": "「ソロモンよ、私は帰ってきた!」核は相変わらず、撃てない。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameAll": [
              "ガトー",
              "ザク"
            ]
          }
        },
        {
          "match": {
            "nameAll": [
              "ガトー",
              "ゲルググ"
            ],
            "nameExcludes": "Ver.2.0"
          }
        },
        {
          "match": {
            "nameAll": [
              "ガトー",
              "ゲルググ",
              "Ver.2.0"
            ]
          }
        },
        {
          "match": {
            "codePrefix": "RX-78GP02"
          }
        }
      ]
    }
  },
  {
    "id": "jegan_top",
    "universe": "UC",
    "no": 22,
    "group": "combo",
    "name": "ジェガン、量産機の到達点",
    "sub": "「使い捨てだなんて、もったいない」を地で行く名脇役の系譜。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ジェガン",
            "nameExcludes": [
              "D型",
              "スターク"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "ジェガンD型"
          }
        },
        {
          "match": {
            "nameIncludes": "スタークジェガン"
          }
        },
        {
          "match": {
            "nameIncludes": "ジェスタ",
            "nameExcludes": "キャノン"
          }
        },
        {
          "match": {
            "nameIncludes": "ジェスタ・キャノン"
          }
        }
      ]
    }
  },
  {
    "id": "v_sakusen",
    "universe": "UC",
    "no": 23,
    "group": "combo",
    "name": "V作戦、完遂",
    "sub": "連邦の希望、3機。Gファイターがあれば、ごっこ遊びは無限。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "code": "RX-78-2"
          }
        },
        {
          "match": {
            "nameIncludes": "ガンキャノン"
          }
        },
        {
          "match": {
            "nameIncludes": "ガンタンク"
          }
        }
      ]
    }
  },
  {
    "id": "fsws",
    "universe": "UC",
    "no": 24,
    "group": "combo",
    "name": "FSWS計画",
    "sub": "全身これミサイル。重装の系譜、接着剤との終わりなき戦い。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "フルアーマーガンダム"
          }
        },
        {
          "match": {
            "nameIncludes": "ヘビー・ガンダム"
          }
        },
        {
          "match": {
            "nameIncludes": "パーフェクトガンダム"
          }
        }
      ]
    }
  },
  {
    "id": "feet_decor",
    "universe": "UC",
    "no": 25,
    "group": "combo",
    "name": "足は飾りです",
    "sub": "「偉い人にはそれが分からんのですよ」。完成しても、やっぱり足は付いてない。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ジオング",
            "nameExcludes": "パーフェクト"
          }
        },
        {
          "match": {
            "nameIncludes": "パーフェクトジオング"
          }
        }
      ]
    }
  },
  {
    "id": "perfected",
    "universe": "UC",
    "no": 26,
    "group": "combo",
    "name": "完成された者の孤独",
    "sub": "サイコミュの極致が二体。フィン・ファンネルとサイコミュ・ワイヤー、絡まり注意。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "パーフェクトジオング"
          }
        },
        {
          "match": {
            "code": "RX-93"
          }
        }
      ]
    }
  },
  {
    "id": "frontal",
    "universe": "UC",
    "no": 27,
    "group": "combo",
    "name": "フロンタルの器",
    "sub": "「私はシャアの再来だ」。赤い器を3つ並べても、中身は空虚。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シナンジュ",
            "nameExcludes": "スタイン"
          }
        },
        {
          "match": {
            "nameIncludes": "シナンジュ・スタイン",
            "line": "Ver.Ka"
          }
        },
        {
          "match": {
            "nameIncludes": "シナンジュ・スタイン",
            "series": "NT"
          }
        }
      ]
    }
  },
  {
    "id": "alice",
    "universe": "UC",
    "no": 28,
    "group": "combo",
    "name": "ALICE、目覚める",
    "sub": "『ガンダム・センチネル』完全再現。知ってる人だけが静かに発狂する深度。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "Sガンダム",
            "nameExcludes": "Ex"
          }
        },
        {
          "match": {
            "nameIncludes": "Ex-Sガンダム"
          }
        },
        {
          "match": {
            "nameIncludes": "FAZZ"
          }
        },
        {
          "match": {
            "nameIncludes": "ガンダムMk-V"
          }
        },
        {
          "match": {
            "nameIncludes": "ディープストライカー"
          }
        }
      ]
    }
  },
  {
    "id": "jupiter",
    "universe": "UC",
    "no": 29,
    "group": "combo",
    "name": "木星帰りの男",
    "sub": "シーブックがキンケドゥになるまで。鉄仮面の美学から、海賊の髑髏へ。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "F91"
          }
        },
        {
          "match": {
            "nameAll": [
              "クロスボーン",
              "X-1"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "f90_atoz",
    "universe": "UC",
    "no": 30,
    "group": "combo",
    "name": "F90、AからZまで",
    "sub": "アルファベット全部集める呪い。『F90 A to Z』、Zは「絶望」のZ。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameAll": [
              "ガンダムF90"
            ],
            "nameExcludes": "II"
          }
        },
        {
          "match": {
            "nameIncludes": "クラスターガンダム"
          }
        },
        {
          "match": {
            "nameIncludes": "ガンレイド"
          }
        },
        {
          "count": {
            "nameIncludes": "ミッションパック",
            "accessory": true
          },
          "gte": 3
        }
      ]
    }
  },
  {
    "id": "kurorekishi",
    "universe": "UC",
    "no": 31,
    "group": "combo",
    "name": "黒歴史、全消去",
    "sub": "ヒゲと、その兄弟。月光蝶を起動した瞬間、これまでの達成も無かったことに。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "月光蝶"
          }
        },
        {
          "match": {
            "nameIncludes": "ターンX"
          }
        }
      ]
    }
  },
  {
    "id": "adults_lie",
    "universe": "UC",
    "no": 32,
    "group": "combo",
    "name": "大人は嘘をつく",
    "sub": "ティターンズの正義。子供だったカミーユが見た、大人の汚さ。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameAll": [
              "ガンダムMk-II",
              "(ティターンズ)"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "ハイザック"
          }
        }
      ]
    }
  },
  {
    "id": "design_war",
    "universe": "UC",
    "no": 33,
    "group": "combo",
    "name": "大河原か、永野か",
    "sub": "永野護の百式と、出渕裕のサザビー。MSデザイン史の二大潮流が睨み合う。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "百式"
          }
        },
        {
          "match": {
            "nameIncludes": "サザビー"
          }
        }
      ]
    }
  },
  {
    "id": "katoki",
    "universe": "UC",
    "no": 34,
    "group": "combo",
    "name": "線の魔術師",
    "sub": "モールドの暴力。素組みで完成された情報量。塗装派への挑戦状。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シナンジュ",
            "line": "Ver.Ka"
          }
        },
        {
          "match": {
            "nameIncludes": "ユニコーン",
            "line": "Ver.Ka"
          }
        }
      ]
    }
  },
  {
    "id": "casval_if",
    "universe": "UC",
    "no": 35,
    "group": "combo",
    "name": "キャスバルという可能性",
    "sub": "もしシャアが復讐を選ばなかったら。連邦のガンダムも、彼の手では赤く染まる。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "キャスバル"
          }
        },
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-06"
          }
        }
      ]
    }
  },
  {
    "id": "kyoshiro",
    "universe": "UC",
    "no": 36,
    "group": "combo",
    "name": "狂四郎の夢",
    "sub": "漫画から生まれ、公式になった機体。「プラモは、自由だ」。改造erの原点に献杯。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "パーフェクトガンダム"
          }
        },
        {
          "match": {
            "code": "RX-78-2"
          }
        }
      ]
    }
  },
  {
    "id": "red_again",
    "universe": "UC",
    "no": 37,
    "group": "combo",
    "name": "赤い彗星、再臨また再臨",
    "sub": "一年戦争、逆襲、そしてUC。世界はいつの時代も「赤い男」を求める。様式美という呪縛。",
    "hidden": false,
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シャア専用",
            "codePrefix": "MS-06"
          }
        },
        {
          "match": {
            "nameIncludes": "シナンジュ",
            "nameExcludes": "スタイン"
          }
        },
        {
          "match": {
            "nameIncludes": "サザビー"
          }
        }
      ]
    }
  }
];
