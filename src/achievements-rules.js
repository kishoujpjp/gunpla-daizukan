// AUTO-GENERATED achievement rules. 87 live achievements (37 UC + 50 SEED/C.E.).
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
            "grade": "MG"
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
  },
  {
    "id": "ce_x_clones",
    "universe": "SEED",
    "no": 1,
    "group": "combo",
    "name": "父と、私と、私",
    "sub": "アル・ダ・フラガの顔を持つ男たち。原型のムウ、その複製クルーゼ、さらにその複製レイ。プロヴィデンス・レジェンド・アカツキ——同じ遺伝子が三度戦場に立つ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X13A"
          }
        },
        {
          "match": {
            "codePrefix": "ZGMF-X666"
          }
        },
        {
          "match": {
            "code": "ORB-01"
          }
        }
      ]
    }
  },
  {
    "id": "ce_artificial_brothers",
    "universe": "SEED",
    "no": 2,
    "group": "combo",
    "name": "出来損ないと、最高傑作",
    "sub": "『究極のコーディネイター』計画の光と影。完成品のキラと、失敗作と切り捨てられたカナード・パルス。フリーダムとハイペリオン、皮肉な兄弟の対面。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "CAT1-X1/3"
          }
        }
      ]
    }
  },
  {
    "id": "ce_mu_identity",
    "universe": "SEED",
    "no": 3,
    "group": "combo",
    "name": "俺の獲物に手を出すな",
    "sub": "記憶を失いネオ・ロアノークとして連合のウィンダムに乗った男は、やがて暁で『ムウ・ラ・フラガ』を取り戻す。仮面の下の、不死身の鷹。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ネオ・ロアノーク"
          }
        },
        {
          "match": {
            "code": "ORB-01"
          }
        }
      ]
    }
  },
  {
    "id": "ce_heliopolis_ghosts",
    "universe": "SEED",
    "no": 4,
    "group": "combo",
    "name": "ヘリオポリスの亡霊",
    "sub": "失われた最初の五機が、外伝で甦る。テスタメントを軸に、ストライク・バスター・デュエル・イージスが再集結。すべての始まりへの回帰。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X12A"
          }
        },
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "GAT-X103"
          }
        },
        {
          "match": {
            "code": "GAT-X102"
          }
        },
        {
          "match": {
            "code": "GAT-X303"
          }
        }
      ]
    }
  },
  {
    "id": "ce_extended_stolen",
    "universe": "SEED",
    "no": 5,
    "group": "combo",
    "name": "強奪、再び",
    "sub": "アーモリーワンで歴史が繰り返す。今度はエクステンデッドの少年少女が奪う番——スティングのカオス、ステラのガイア、アウルのアビス。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X24S"
          }
        },
        {
          "match": {
            "code": "ZGMF-X88S"
          }
        },
        {
          "match": {
            "code": "ZGMF-X31S"
          }
        }
      ]
    }
  },
  {
    "id": "ce_extended_tragedy",
    "universe": "SEED",
    "no": 6,
    "group": "combo",
    "name": "死ぬのは、こわい",
    "sub": "「ステラ……!」記憶を弄られ、恐怖だけを残された少女。彼女を救えなかったシンの慟哭。ガイアとデスティニーが背負う、種死で最も重い喪失。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X88S"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        }
      ]
    }
  },
  {
    "id": "ce_all_zaku",
    "universe": "SEED",
    "no": 7,
    "group": "count",
    "name": "ザクとは違うのだよ",
    "sub": "ザフトの量産機がカッコいいという呪い。ウォーリアもファントムも、気づけば棚はモノアイだらけ。5機集めれば、もう立派なザフト党員。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "ZGMF-100"
      },
      "gte": 5
    }
  },
  {
    "id": "ce_zaku_aces",
    "universe": "SEED",
    "no": 8,
    "group": "combo",
    "name": "モノアイのエースたち",
    "sub": "エース専用ザクの揃い踏み。イザークのスラッシュ、レイのブレイズ、ディアッカのブレイズ、ルナマリアのガナー。指揮官機の風格、ここにあり。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "イザーク"
          }
        },
        {
          "match": {
            "nameIncludes": "レイ・ザ・バレル"
          }
        },
        {
          "match": {
            "nameIncludes": "ディアッカ"
          }
        },
        {
          "match": {
            "code": "ZGMF-1000/A1"
          }
        }
      ]
    }
  },
  {
    "id": "ce_gouf_squad",
    "universe": "SEED",
    "no": 9,
    "group": "combo",
    "name": "グフ、イグナイテッド",
    "sub": "ザフトの白兵戦用MS、グフイグナイテッド。ハイネの橙、イザークの青、そして量産機。ヒートロッドとビームソードで斬り込む蛮勇の部隊。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X2000"
          }
        },
        {
          "match": {
            "nameAll": [
              "グフ",
              "イザーク"
            ]
          }
        },
        {
          "match": {
            "nameAll": [
              "グフ",
              "量産"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "ce_ginn_legacy",
    "universe": "SEED",
    "no": 10,
    "group": "combo",
    "name": "ジン乗りに聞け",
    "sub": "「ジンのことは、ジン乗りに聞け」ミゲルの名言から始まる量産機の系譜。エースのジン、無数の量産ジン、そして外伝のジングラディエイターまで。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ミゲル"
          }
        },
        {
          "match": {
            "code": "ZGMF-1017"
          }
        },
        {
          "match": {
            "code": "ZGMF-1017GR"
          }
        }
      ]
    }
  },
  {
    "id": "ce_red_all",
    "universe": "SEED",
    "no": 11,
    "group": "count",
    "name": "赤いヤツは、何度でも",
    "sub": "レッドフレーム・改・パワードレッド・レッドドラゴン……バンダイは赤を何度でも売る。三倍どころの騒ぎではない散財。4機集めて、ジャンク屋の常連認定。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "レッドフレーム"
      },
      "gte": 4
    }
  },
  {
    "id": "ce_astray_frames",
    "universe": "SEED",
    "no": 12,
    "group": "combo",
    "name": "五大フレーム、競演",
    "sub": "アストレイの主要フレーム勢揃い。P02の赤、P03の青、P01の金、P0Xの黒、P05の幻。ジャンク屋たちが夢に見た、模造ガンダムの祭典。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MBF-P02"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-P03"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-P01"
          }
        },
        {
          "match": {
            "code": "MBF-P0X"
          }
        },
        {
          "match": {
            "code": "MBF-P05LM2"
          }
        }
      ]
    }
  },
  {
    "id": "ce_amatsu",
    "universe": "SEED",
    "no": 13,
    "group": "count",
    "name": "天、堕つ",
    "sub": "ロンド・ギナ・サハクの黄金、ゴールドフレーム天（アマツ）の系譜。和の意匠と妖刀『迅雷』。2機集めれば、サハク家の野望を継ぐ者。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "MBF-P01-Re"
      },
      "gte": 2
    }
  },
  {
    "id": "ce_x_astray",
    "universe": "SEED",
    "no": 14,
    "group": "combo",
    "name": "Xアストレイの彼方",
    "sub": "外伝Xアストレイの深淵。プレア・レヴェリーのドレッドノート、カナードのハイペリオン、そして始祖たるゴールドフレーム。最深部の三機。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "YMF-X000A"
          }
        },
        {
          "match": {
            "code": "CAT1-X1/3"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-P01"
          }
        }
      ]
    }
  },
  {
    "id": "ce_druggies_meme",
    "universe": "SEED",
    "no": 15,
    "group": "combo",
    "name": "いいぞ、もっとだ！",
    "sub": "オルガ「いいぞォ！」薬漬けトリオの狂宴。カラミティ・レイダー・フォビドゥン。連携などではない、ただの暴走——強化人間という名のドーピング。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X131"
          }
        },
        {
          "match": {
            "code": "GAT-X370"
          }
        },
        {
          "match": {
            "code": "GAT-X252"
          }
        }
      ]
    }
  },
  {
    "id": "ce_calamity_if",
    "universe": "SEED",
    "no": 16,
    "group": "combo",
    "name": "ありえたかもしれない砲撃",
    "sub": "砲撃機にエールを背負わせる、プレバンの『if』。カラミティとエールカラミティ。誰も望まなかった可能性を、バンダイだけが立体化する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X131"
          }
        },
        {
          "match": {
            "code": "GAT-X130"
          }
        }
      ]
    }
  },
  {
    "id": "ce_calamity_full",
    "universe": "SEED",
    "no": 17,
    "group": "combo",
    "name": "カラミティ、全部乗せ",
    "sub": "X13系コンプリート。砲撃のX131、エールのX130、ソードのX133、そしてクリアカラー。連合第二世代を全形態で揃える、商魂への挑戦状。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X131"
          }
        },
        {
          "match": {
            "code": "GAT-X130"
          }
        },
        {
          "match": {
            "code": "GAT-X133"
          }
        },
        {
          "match": {
            "nameAll": [
              "カラミティ",
              "クリアカラー"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "ce_pbandai_swamp",
    "universe": "SEED",
    "no": 18,
    "group": "combo",
    "name": "型録の深淵",
    "sub": "プレバン・外伝・MSVの濃いメンツ。エールカラミティ、ジングラディエイター、エクリプス2号機、レイダー。公式が忘れた頃に立体化される、沼の住人たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X130"
          }
        },
        {
          "match": {
            "code": "ZGMF-1017GR"
          }
        },
        {
          "match": {
            "code": "MVF-X08R2"
          }
        },
        {
          "match": {
            "code": "GAT-X370"
          }
        }
      ]
    }
  },
  {
    "id": "ce_final_yakin",
    "universe": "SEED",
    "no": 19,
    "group": "combo",
    "name": "終末の光",
    "sub": "PHASE-49。ヤキン・ドゥーエ最終決戦。自由と正義 vs 運命。核とニュートロンスタンピーダーが交錯し、第一次大戦が終わる——フリーダム・ジャスティス・プロヴィデンス。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X09A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X13A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_golden_will",
    "universe": "SEED",
    "no": 20,
    "group": "combo",
    "name": "黄金の意志",
    "sub": "PHASE-40、黄金の翼が宇宙に煌めく。ストライクフリーダムとインフィニットジャスティス、キラとアスランが議長の『運命』に立ち向かう。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X19A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_blue_wings",
    "universe": "SEED",
    "no": 21,
    "group": "combo",
    "name": "前作主人公機、堕つ",
    "sub": "種死序盤の衝撃。シンのフォースインパルスが、盤石の象徴だったキラのフリーダムを撃墜する。世代交代という名の、容赦ない一撃。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "codePrefix": "ZGMF-X56S"
          }
        }
      ]
    }
  },
  {
    "id": "ce_phase_shift_down",
    "universe": "SEED",
    "no": 22,
    "group": "combo",
    "name": "フェイズシフトダウン",
    "sub": "バッテリー切れの恐怖。装甲の色が失せ、機体が沈黙する絶望の瞬間。初代SEEDが描いた、リアルなエネルギー切れ——ストライクとイージスの死闘。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "GAT-X303"
          }
        }
      ]
    }
  },
  {
    "id": "ce_name_is_gundam",
    "universe": "SEED",
    "no": 23,
    "group": "combo",
    "name": "その名はガンダム",
    "sub": "PHASE-02。キラが咄嗟にOSを書き換え、起動画面に『G.U.N.D.A.M.』と刻む。ザフトのジンとの邂逅から、すべての戦争が始まった。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "ZGMF-1017"
          }
        },
        {
          "match": {
            "code": "GAT-X303"
          }
        }
      ]
    }
  },
  {
    "id": "ce_lacus_gift",
    "universe": "SEED",
    "no": 24,
    "group": "combo",
    "name": "ラクスの贈り物",
    "sub": "「あなたのその力で、何を守るの?」ラクス・クラインがキラに託した二つの自由——フリーダムとストライクフリーダム。歌姫の祈りが結晶した機体。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_athrun_loses",
    "universe": "SEED",
    "no": 25,
    "group": "combo",
    "name": "アスラン、また負ける",
    "sub": "自爆し、撃墜され、寝返っても噛ませ役。イージス・セイバー・インフィニットジャスティス——それでも立ち上がる、永遠の二番手の意地。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X303"
          }
        },
        {
          "match": {
            "code": "ZGMF-X23S"
          }
        },
        {
          "match": {
            "code": "ZGMF-X19A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_cagalli_neglect",
    "universe": "SEED",
    "no": 26,
    "group": "combo",
    "name": "あまり乗らない代表首長",
    "sub": "カガリ・ユラ・アスハの専用機、ストライクルージュと暁。だが政務に追われ、出撃は少なめ。「やめてよね、本気で……」名機の宝の持ち腐れ疑惑。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "MBF-02"
          }
        },
        {
          "match": {
            "code": "ORB-01"
          }
        }
      ]
    }
  },
  {
    "id": "ce_fake_idol",
    "universe": "SEED",
    "no": 27,
    "group": "combo",
    "name": "偽りの歌姫",
    "sub": "ミーア・キャンベル、ラクスを演じさせられた少女。ライブコンサート仕様のザクと、本物のラクスが託したストライクフリーダム。二人の歌姫の悲劇。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ライブコンサート"
          }
        },
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_desert_tiger",
    "universe": "SEED",
    "no": 28,
    "group": "combo",
    "name": "砂漠の虎、牙を変える",
    "sub": "アンドリュー・バルトフェルド。かつてキラと砂漠で死闘を演じた虎は、種死ではガイアでアスハ陣営に。立場を変えても、その牙は鋭い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "バルトフェルド"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-02"
          }
        }
      ]
    }
  },
  {
    "id": "ce_durandal_plan",
    "universe": "SEED",
    "no": 29,
    "group": "combo",
    "name": "ディスティニープラン",
    "sub": "遺伝子が運命を決める世界。クルーゼの厭世が、デュランダルの計画へ、レイの忠誠へと連なる。プロヴィデンス・デスティニー・レジェンド——運命に縛られた者たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X13A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        },
        {
          "match": {
            "codePrefix": "ZGMF-X666"
          }
        }
      ]
    }
  },
  {
    "id": "ce_blue_cosmos",
    "universe": "SEED",
    "no": 30,
    "group": "combo",
    "name": "青き清浄なる世界を",
    "sub": "ブルーコスモスの狂信。ナチュラル至上主義が量産した刃——ストライク、薬漬けのカラミティ、ウィンダム、ダガーL。差別が生んだ機体の系譜。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "GAT-X131"
          }
        },
        {
          "match": {
            "code": "GAT-04"
          }
        },
        {
          "match": {
            "codePrefix": "GAT-02"
          }
        }
      ]
    }
  },
  {
    "id": "ce_ea_mass",
    "universe": "SEED",
    "no": 31,
    "group": "combo",
    "name": "数で押す連合",
    "sub": "質のコーディネイターに、数のナチュラルで対抗する。ストライクダガー、ダガーL、ウィンダム。地味だが戦争を支えた、連合量産機の三世代。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-01"
          }
        },
        {
          "match": {
            "codePrefix": "GAT-02"
          }
        },
        {
          "match": {
            "code": "GAT-04"
          }
        }
      ]
    }
  },
  {
    "id": "ce_relation_frey",
    "universe": "SEED",
    "no": 32,
    "group": "combo",
    "name": "撃ち落としてしまえ",
    "sub": "フレイ・アルスターの憎悪と、揺れるキラ。彼女に背を押され、キラはストライクで多くのザフト兵を撃つ。ジンとの戦いに刻まれた、少年の罪。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "ZGMF-1017"
          }
        }
      ]
    }
  },
  {
    "id": "ce_clear_color",
    "universe": "SEED",
    "no": 33,
    "group": "count",
    "name": "スケスケ商法",
    "sub": "クリアカラー版。中身が透けて見えても性能は変わらない。それでも『限定』の二文字に負けて買ってしまう。2機で、透明への執着を認定。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "クリアカラー",
        "series": "ガンダムSEED"
      },
      "gte": 2
    }
  },
  {
    "id": "ce_special_coat",
    "universe": "SEED",
    "no": 34,
    "group": "count",
    "name": "メッキ地獄",
    "sub": "スペシャルコーティングVer.。同じ機体が、倍の値段で眩く光る。フリーダムもジャスティスもプロヴィデンスも金ピカに。2機で、光沢の沼へようこそ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "コーティング",
        "series": "ガンダムSEED"
      },
      "gte": 2
    }
  },
  {
    "id": "ce_strike_freedom_x3",
    "universe": "SEED",
    "no": 35,
    "group": "count",
    "name": "黄金、何度でも",
    "sub": "ストライクフリーダムを、いったい何個買えば気が済むのか。MG・RG・PG・MGEX……スケール違いで増殖する黄金。3機で、ストフリ中毒を認定。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "code": "ZGMF-X20A"
      },
      "gte": 3
    }
  },
  {
    "id": "ce_destiny_recycle",
    "universe": "SEED",
    "no": 36,
    "group": "count",
    "name": "総集編で、また観た",
    "sub": "種死名物、作画使い回し。光の翼のバンクシーンは何度流れたか。デスティニー系を集めるほど募る、あの既視感。4機で、バンク職人の称号。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "デスティニー",
        "series": "ガンダムSEED"
      },
      "gte": 4
    }
  },
  {
    "id": "ce_seed_factor",
    "universe": "SEED",
    "no": 37,
    "group": "combo",
    "name": "種、割れる",
    "sub": "瞳孔が開き、限界を超える——SEEDを宿す者たち。キラのフリーダム、アスランのジャスティス、カガリのストライクルージュ。覚醒した三人の機体。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X09A"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-02"
          }
        }
      ]
    }
  },
  {
    "id": "ce_minerva",
    "universe": "SEED",
    "no": 38,
    "group": "combo",
    "name": "ミネルバ、出航",
    "sub": "戦艦ミネルバの若き戦士たち。インパルスのシン、ガナーザクのルナマリア、ブレイズザクのレイ、そして一時在籍したデスティニー。新世代の総員。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "ZGMF-X56S"
          }
        },
        {
          "match": {
            "code": "ZGMF-1000/A1"
          }
        },
        {
          "match": {
            "nameIncludes": "レイ・ザ・バレル"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        }
      ]
    }
  },
  {
    "id": "ce_stargazer",
    "universe": "SEED",
    "no": 39,
    "group": "combo",
    "name": "星を、見つめて",
    "sub": "OVA STARGAZER。深宇宙探査機スターゲイザーと、ファントムペインの黒いストライク——ノワール、そしてストライクE。星に手を伸ばす者たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GSX-401FW"
          }
        },
        {
          "match": {
            "code": "GAT-X105E"
          }
        },
        {
          "match": {
            "code": "GAT-X105E+AQM/E-M1"
          }
        }
      ]
    }
  },
  {
    "id": "ce_eclipse_saga",
    "universe": "SEED",
    "no": 40,
    "group": "combo",
    "name": "蝕の系譜",
    "sub": "外伝SEED ECLIPSE勢揃い。新世代連合機エクリプスとその2号機、そして初期量産機を再生したジングラディエイター。本編の外側で続くCE。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MVF-X08"
          }
        },
        {
          "match": {
            "code": "MVF-X08R2"
          }
        },
        {
          "match": {
            "code": "ZGMF-1017GR"
          }
        }
      ]
    }
  },
  {
    "id": "ce_vs_astray",
    "universe": "SEED",
    "no": 41,
    "group": "combo",
    "name": "VS ASTRAYの果て",
    "sub": "外伝VS ASTRAY/DESTINY ASTRAYの最深部。レッドフレーム改、ミラージュフレーム、暗躍するテスタメント。本編から遠く離れた地で交わる糸。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MBF-P02KAI"
          }
        },
        {
          "match": {
            "code": "MBF-P05LM2"
          }
        },
        {
          "match": {
            "code": "ZGMF-X12A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_clyne_armada",
    "universe": "SEED",
    "no": 42,
    "group": "combo",
    "name": "クライン派、全力出撃",
    "sub": "ラクス私設艦隊の最強戦力。フリーダム・ストライクフリーダム・インフィニットジャスティス、そしてカガリの暁。三隻同盟の機体、総出。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X19A"
          }
        },
        {
          "match": {
            "code": "ORB-01"
          }
        }
      ]
    }
  },
  {
    "id": "ce_x_project",
    "universe": "SEED",
    "no": 43,
    "group": "combo",
    "name": "ザフトX計画の頂点",
    "sub": "プラントが生んだZGMF-X系試作機の精華。自由・正義・運命の三機に、プロヴィデンス・レジェンド・ストライクフリーダムを加えた、技術の結晶群。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X09A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X13A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        },
        {
          "match": {
            "codePrefix": "ZGMF-X666"
          }
        },
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_orb_full",
    "universe": "SEED",
    "no": 44,
    "group": "combo",
    "name": "オーブ総力戦",
    "sub": "中立国オーブの全戦力。アストレイの赤・青・金、量産機ムラサメ、カガリのストライクルージュと暁。「力には屈しない」——が、戦力は揃える。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "MBF-02"
          }
        },
        {
          "match": {
            "code": "MBF-P02"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-P03"
          }
        },
        {
          "match": {
            "codePrefix": "MBF-P01"
          }
        },
        {
          "match": {
            "nameIncludes": "ムラサメ"
          }
        },
        {
          "match": {
            "code": "ORB-01"
          }
        }
      ]
    }
  },
  {
    "id": "ce_destiny_final",
    "universe": "SEED",
    "no": 45,
    "group": "combo",
    "name": "選びとる未来",
    "sub": "PHASE-FINAL、最後の戦い。キラのストライクフリーダム、シンのデスティニー、レイのレジェンド、アスランのインフィニットジャスティス。四つの意志の激突。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        },
        {
          "match": {
            "codePrefix": "ZGMF-X666"
          }
        },
        {
          "match": {
            "code": "ZGMF-X19A"
          }
        }
      ]
    }
  },
  {
    "id": "ce_first_war_end",
    "universe": "SEED",
    "no": 46,
    "group": "combo",
    "name": "終わらない明日へ",
    "sub": "SEED PHASE-50。第一次連合・プラント大戦の終結。キラのフリーダムとクルーゼのプロヴィデンス、そしてストライクとイージス——すべての因縁に決着を。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X13A"
          }
        },
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "GAT-X303"
          }
        }
      ]
    }
  },
  {
    "id": "ce_grand_collection",
    "universe": "SEED",
    "no": 47,
    "group": "count",
    "name": "コズミック・イラ全踏破",
    "sub": "MGもHGもRGもPGもFMもHIRMも。縮尺を問わずCEを蒐集する者。50機を超えれば、もはや宇宙紀元の生き字引——提督の中の提督。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ガンダムSEED"
      },
      "gte": 50
    }
  },
  {
    "id": "ce_protagonist_curse",
    "universe": "SEED",
    "no": 48,
    "group": "combo",
    "name": "主人公補正という呪い",
    "sub": "歴代主人公機の総覧。ストライク・フリーダム・ストライクフリーダム・インパルス・デスティニー。キラもシンも、種が割れれば敵なし——理不尽の系譜。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "ZGMF-X10A"
          }
        },
        {
          "match": {
            "code": "ZGMF-X20A"
          }
        },
        {
          "match": {
            "codePrefix": "ZGMF-X56S"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        }
      ]
    }
  },
  {
    "id": "ce_nicol_memorial",
    "universe": "SEED",
    "no": 49,
    "group": "combo",
    "name": "ニコルのピアノ",
    "sub": "クルーゼ隊の四人——ニコルのブリッツ、アスランのイージス、ディアッカのバスター、イザークのデュエル。だがニコルのピアノは、もう聴けない。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X207"
          }
        },
        {
          "match": {
            "code": "GAT-X303"
          }
        },
        {
          "match": {
            "code": "GAT-X103"
          }
        },
        {
          "match": {
            "code": "GAT-X102"
          }
        }
      ]
    }
  },
  {
    "id": "ce_war_never_changes",
    "universe": "SEED",
    "no": 50,
    "group": "combo",
    "name": "戦争は、変わらない",
    "sub": "CE71からCE73、そして外伝の彼方へ。ストライク・デスティニー・エクリプス。時代が移り変わっても、ガンダムはなお戦い続ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GAT-X105"
          }
        },
        {
          "match": {
            "code": "ZGMF-X42S"
          }
        },
        {
          "match": {
            "code": "MVF-X08"
          }
        }
      ]
    }
  }
];
