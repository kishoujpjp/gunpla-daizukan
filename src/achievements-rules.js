// AUTO-GENERATED achievement rules. 407 live achievements
// (37 UC + 50 C.E. + 20 F.C. + 40 A.C. + 10 A.W. + 40 A.D. + 20 A.G. + 40 P.D. + 30 A.S. + 20 R.C. + 20 C.C. + 30 GQX + 50 BF).
// fields: id, universe(UC/SEED/W/X/G/00/AGE/IBO/AS/RC/CC/GQX/BF/other), no(1-based per universe), group, name, sub, hidden, scope?, rule
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
    "sub": "プレバン・外伝の濃いメンツ。エールカラミティ、ジングラディエイター、エクリプス2号機、そしてブーストレイダー。SEED ECLIPSEの深部、公式が忘れた頃に立体化される沼の住人たち。",
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
            "code": "GAT-XX370"
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
  },
  {
    "id": "g_two_lights",
    "universe": "G",
    "no": 1,
    "group": "combo",
    "name": "この手が光って唸る",
    "sub": "ドモン・カッシュの二機。瀕死から甦り、シャイニングガンダムからゴッドガンダムへ。『この手が光って唸る』シャイニングフィンガーから、『真っ赤に燃えている』ゴッドフィンガーへ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJ"
          }
        },
        {
          "match": {
            "code": "GF13-017NJII"
          }
        }
      ]
    }
  },
  {
    "id": "g_meikyoshisui",
    "universe": "G",
    "no": 2,
    "group": "combo",
    "name": "明鏡止水、乱れ封じる",
    "sub": "心、明鏡止水——技の極致ハイパーモード。ゴッドとマスター、師弟がともに金色に輝く。怒りを越え、静けさの中で放つ究極の一撃。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameAll": [
              "ハイパーモード"
            ],
            "nameExcludes": "マスター"
          }
        },
        {
          "match": {
            "nameAll": [
              "ハイパーモード",
              "マスター"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "g_domon_arsenal",
    "universe": "G",
    "no": 3,
    "group": "combo",
    "name": "真っ赤に燃える拳",
    "sub": "ドモンの全進化形態。シャイニング、ゴッド、そして明鏡止水のハイパーモード。少年が拳一つで頂点へ駆け上がった軌跡。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJ"
          }
        },
        {
          "match": {
            "code": "GF13-017NJII",
            "nameExcludes": "ハイパーモード"
          }
        },
        {
          "match": {
            "nameAll": [
              "ハイパーモード"
            ],
            "nameExcludes": "マスター"
          }
        }
      ]
    }
  },
  {
    "id": "g_master_debut",
    "universe": "G",
    "no": 4,
    "group": "combo",
    "name": "見よ、東方は赤く燃えている",
    "sub": "流派東方不敗マスター・アジア、登場。かつての師がシャイニングガンダムの前に立ちはだかる。『天はオレを呼んでいる』——王者の風が吹き荒れる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJ"
          }
        },
        {
          "match": {
            "nameIncludes": "マスターガンダム"
          }
        }
      ]
    }
  },
  {
    "id": "g_master_disciple",
    "universe": "G",
    "no": 5,
    "group": "combo",
    "name": "さらば師よ",
    "sub": "流派東方不敗、師弟最終決戦。ゴッドガンダムとマスターガンダム、石破天驚拳がぶつかり合う。地球を救う道を巡り、教え子は師を超える。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJII"
          }
        },
        {
          "match": {
            "nameIncludes": "マスターガンダム"
          }
        }
      ]
    }
  },
  {
    "id": "g_sekiha",
    "universe": "G",
    "no": 6,
    "group": "combo",
    "name": "石破天驚拳、継承者たち",
    "sub": "流派東方不敗の奥義・石破天驚拳を放つ三人。ドモンのゴッド、東方不敗のマスター、そして謎の剣士シュバルツのシュピーゲル。天破侠乱の系譜。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJII"
          }
        },
        {
          "match": {
            "nameIncludes": "マスターガンダム"
          }
        },
        {
          "match": {
            "code": "GF13-021NG"
          }
        }
      ]
    }
  },
  {
    "id": "g_schwarz",
    "universe": "G",
    "no": 7,
    "group": "combo",
    "name": "黒い稲妻、シュバルツ",
    "sub": "謎の剣士シュバルツ・ブルーダーがガンダムシュピーゲルでドモンを導く。忍術めいた残像と刃で、未熟な闘士を鍛え上げる影の師。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-021NG"
          }
        },
        {
          "match": {
            "code": "GF13-017NJ"
          }
        }
      ]
    }
  },
  {
    "id": "g_brothers",
    "universe": "G",
    "no": 8,
    "group": "combo",
    "name": "兄キョウジの面影",
    "sub": "シュバルツの正体は、兄キョウジのデータから生まれた存在。シュピーゲルとゴッド——失われた兄の意志が、弟ドモンの背を押す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-021NG"
          }
        },
        {
          "match": {
            "code": "GF13-017NJII"
          }
        }
      ]
    }
  },
  {
    "id": "g_shuffle",
    "universe": "G",
    "no": 9,
    "group": "combo",
    "name": "シャッフル同盟、見参",
    "sub": "キング・オブ・ハートのドモン、クィーン・ザ・スペードのチボデー、ジャック…宿命を背負った闘士たち。ゴッド・マックスター・ローズ・ドラゴンが拳を交わし、やがて絆となる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJII"
          }
        },
        {
          "match": {
            "code": "GF13-006NA"
          }
        },
        {
          "match": {
            "code": "GF13-009NF"
          }
        },
        {
          "match": {
            "code": "GF13-011NC"
          }
        }
      ]
    }
  },
  {
    "id": "g_true_shuffle",
    "universe": "G",
    "no": 10,
    "group": "combo",
    "name": "真・シャッフル同盟拳",
    "sub": "ドモン・チボデー・ジョルジュ・サイ・サイシー、そしてシュバルツ。デビルガンダムに抗うため、闘士たちの拳が一つに重なる——シャッフル同盟拳!",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJII"
          }
        },
        {
          "match": {
            "code": "GF13-006NA"
          }
        },
        {
          "match": {
            "code": "GF13-009NF"
          }
        },
        {
          "match": {
            "code": "GF13-011NC"
          }
        },
        {
          "match": {
            "code": "GF13-021NG"
          }
        }
      ]
    }
  },
  {
    "id": "g_gundam_fight",
    "universe": "G",
    "no": 11,
    "group": "combo",
    "name": "レディ・ゴー！",
    "sub": "第13回ガンダムファイト、開幕。ネオアメリカのマックスター、ネオフランスのローズ、ネオチャイナのドラゴン。国の威信を背負い、地球を舞台に殴り合う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-006NA"
          }
        },
        {
          "match": {
            "code": "GF13-009NF"
          }
        },
        {
          "match": {
            "code": "GF13-011NC"
          }
        }
      ]
    }
  },
  {
    "id": "g_chibodee",
    "universe": "G",
    "no": 12,
    "group": "combo",
    "name": "バーストマシンガンパンチ",
    "sub": "ネオアメリカのチボデー・クロケット。元ボクサーの拳がマックスターから繰り出される。ドモンとは拳で語り合う、熱き好敵手。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-006NA"
          }
        },
        {
          "match": {
            "code": "GF13-017NJII"
          }
        }
      ]
    }
  },
  {
    "id": "g_rose_knight",
    "universe": "G",
    "no": 13,
    "group": "combo",
    "name": "我が薔薇の名にかけて",
    "sub": "ネオフランスの貴公子ジョルジュ・ド・サンドのローズと、剣士シュバルツのシュピーゲル。騎士道とサーベル、誇り高き刃を持つ二人。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-009NF"
          }
        },
        {
          "match": {
            "code": "GF13-021NG"
          }
        }
      ]
    }
  },
  {
    "id": "g_eastern_mystic",
    "universe": "G",
    "no": 14,
    "group": "combo",
    "name": "東洋の神秘",
    "sub": "曼荼羅を冠したマンダラガンダムと、少林の拳を継ぐサイ・サイシーのドラゴン。超級覇王電影弾と祈り——東洋の精神性を宿す機体たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "マンダラ"
          }
        },
        {
          "match": {
            "code": "GF13-011NC"
          }
        }
      ]
    }
  },
  {
    "id": "g_allenby",
    "universe": "G",
    "no": 15,
    "group": "combo",
    "name": "ファイト一発、アレンビー",
    "sub": "ネオスウェーデンのアレンビー・ビアズリー、ノーベルガンダムの乙女。ドモンの好敵手にして、淡い想いを寄せる相手。明るさの裏の孤独。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-050NSW",
            "nameExcludes": "バーサーカー"
          }
        },
        {
          "match": {
            "code": "GF13-017NJII"
          }
        }
      ]
    }
  },
  {
    "id": "g_berserker",
    "universe": "G",
    "no": 16,
    "group": "combo",
    "name": "狂気のバーサーカー",
    "sub": "DG細胞に侵されたノーベルガンダムが、理性を失いバーサーカーモードへ。優しいアレンビーが暴走する悲劇——救えるのはドモンの拳だけ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-050NSW",
            "nameExcludes": "バーサーカー"
          }
        },
        {
          "match": {
            "nameIncludes": "バーサーカー"
          }
        }
      ]
    }
  },
  {
    "id": "g_controlled",
    "universe": "G",
    "no": 17,
    "group": "combo",
    "name": "操られし乙女",
    "sub": "デビルガンダムに与した東方不敗が、DG細胞でアレンビーを操る。バーサーカーのノーベルとマスターガンダム——師の堕落が生んだ、もう一つの戦い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "バーサーカー"
          }
        },
        {
          "match": {
            "nameIncludes": "マスターガンダム"
          }
        }
      ]
    }
  },
  {
    "id": "g_devil_minions",
    "universe": "G",
    "no": 18,
    "group": "combo",
    "name": "デビルガンダムの尖兵",
    "sub": "自己増殖する機械の軍勢、デスアーミーとデスビースト。意志なき鋼の群れが地球を喰らう。デビルガンダムが生み出す、終わりなき脅威。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "JDG-009X"
          }
        },
        {
          "match": {
            "nameIncludes": "デスビースト",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "g_master_fallen",
    "universe": "G",
    "no": 19,
    "group": "combo",
    "name": "堕ちた拳法王",
    "sub": "地球のため、東方不敗はデビルガンダムの側に立つ。マスターガンダムとデスアーミー——かつての英雄が、人類を滅ぼす機械と手を組む皮肉。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "マスターガンダム"
          }
        },
        {
          "match": {
            "code": "JDG-009X"
          }
        }
      ]
    }
  },
  {
    "id": "g_final_fight",
    "universe": "G",
    "no": 20,
    "group": "combo",
    "name": "永遠に輝けガンダムファイト",
    "sub": "全てを賭けた最終決戦。ゴッドガンダムが、兄キョウジを核としたデビルガンダムへ挑む。愛と拳で運命を断ち切る、ドモンの集大成。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GF13-017NJII"
          }
        },
        {
          "match": {
            "code": "JDG-009X"
          }
        }
      ]
    }
  },
  {
    "id": "w_heero",
    "universe": "W",
    "no": 1,
    "group": "combo",
    "name": "お前を殺す",
    "sub": "ヒイロ・ユイの相棒。任務に殉じる完全兵士が駆るウイングガンダムと、ゼロシステムを宿すウイングゼロ。冷徹な台詞の裏に、守るべきものを見出していく。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01W"
          }
        },
        {
          "match": {
            "code": "XXXG-00W0"
          }
        }
      ]
    }
  },
  {
    "id": "w_duo",
    "universe": "W",
    "no": 2,
    "group": "combo",
    "name": "俺は死神だ",
    "sub": "デュオ・マックスウェル、自らを死神と名乗る陽気な戦士。隠密のデスサイズと、漆黒の翼を得たデスサイズヘル。闇に紛れて確実に仕留める。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01D"
          }
        },
        {
          "match": {
            "code": "XXXG-01D2"
          }
        }
      ]
    }
  },
  {
    "id": "w_trowa",
    "universe": "W",
    "no": 3,
    "group": "combo",
    "name": "名もなき道化師",
    "sub": "トロワ・バートン、サーカスに身を隠す寡黙な狙撃手。弾幕のヘビーアームズと、その改修機。無口な男の、無数の銃口が語る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01H"
          }
        },
        {
          "match": {
            "code": "XXXG-01H2"
          }
        }
      ]
    }
  },
  {
    "id": "w_quatre",
    "universe": "W",
    "no": 4,
    "group": "combo",
    "name": "砂漠の継承者",
    "sub": "カトル・ラバーバ・ウィナー、心優しき大富豪の子。双剣のサンドロックと、その改修機。穏やかな少年が、仲間のために剣を取る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01SR"
          }
        },
        {
          "match": {
            "code": "XXXG-01SR2"
          }
        }
      ]
    }
  },
  {
    "id": "w_wufei",
    "universe": "W",
    "no": 5,
    "group": "combo",
    "name": "ナタク、征く",
    "sub": "張五飛、亡き妻の名『ナタク』を機体に重ねる孤高の闘士。龍の如きシェンロンと、双頭のアルトロン。強き者との戦いに、己の正義を問い続ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01S"
          }
        },
        {
          "match": {
            "code": "XXXG-01S2"
          }
        }
      ]
    }
  },
  {
    "id": "w_meteor",
    "universe": "W",
    "no": 6,
    "group": "combo",
    "name": "オペレーション・メテオ",
    "sub": "コロニーから地球へ降下した5機のガンダム。ウイング・デスサイズ・ヘビーアームズ・サンドロック・シェンロン。5人の少年兵による、静かなる宣戦布告。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01W"
          }
        },
        {
          "match": {
            "code": "XXXG-01D"
          }
        },
        {
          "match": {
            "code": "XXXG-01H"
          }
        },
        {
          "match": {
            "code": "XXXG-01SR"
          }
        },
        {
          "match": {
            "code": "XXXG-01S"
          }
        }
      ]
    }
  },
  {
    "id": "w_ew_five",
    "universe": "W",
    "no": 7,
    "group": "combo",
    "name": "終わりなきワルツ",
    "sub": "Endless Waltz の5機。ウイングゼロ・デスサイズヘル・ヘビーアームズ改・サンドロック改・アルトロン。少年たちが最後にもう一度、平和のために戦う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "XXXG-01D2"
          }
        },
        {
          "match": {
            "code": "XXXG-01H2"
          }
        },
        {
          "match": {
            "code": "XXXG-01SR2"
          }
        },
        {
          "match": {
            "code": "XXXG-01S2"
          }
        }
      ]
    }
  },
  {
    "id": "w_gundanium",
    "universe": "W",
    "no": 8,
    "group": "count",
    "name": "ガンダニウム合金",
    "sub": "宇宙でしか精製できぬ最硬の装甲材、ガンダニウム合金。それを纏う機体を5機。コロニーの技術者たちが地球へ送り込んだ、5つの牙。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "XXXG"
      },
      "gte": 5
    }
  },
  {
    "id": "w_zero_system",
    "universe": "W",
    "no": 9,
    "group": "combo",
    "name": "ゼロシステム",
    "sub": "操縦者の精神を直接戦闘へ変換する、悪魔のシステム。これを宿す二機、ウイングゼロとエピオン。ヒイロとゼクスが交換し合った、呪われた力。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "OZ-13MS"
          }
        }
      ]
    }
  },
  {
    "id": "w_descend",
    "universe": "W",
    "no": 10,
    "group": "combo",
    "name": "流星、舞い降りる",
    "sub": "第1話。宇宙から落ちる流星に偽装し、ウイングガンダムが地球へ。迎え撃つOZのエース、トールギスを駆るゼクス・マーキス。宿命の二人の邂逅。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01W"
          }
        },
        {
          "match": {
            "code": "OZ-00MS"
          }
        }
      ]
    }
  },
  {
    "id": "w_quatre_berserk",
    "universe": "W",
    "no": 11,
    "group": "combo",
    "name": "ゼロに飲まれて",
    "sub": "ゼロシステムに精神を蝕まれ、カトルが暴走する。本来のサンドロックと、彼を狂わせたウイングゼロ。優しき少年の、最も昏い瞬間。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "XXXG-01SR"
          }
        }
      ]
    }
  },
  {
    "id": "w_zechs",
    "universe": "W",
    "no": 12,
    "group": "combo",
    "name": "仮面の伯爵",
    "sub": "ゼクス・マーキス——その正体はサンクキングダムの王子ミリアルド・ピースクラフト。最初のトールギスから、再起のトールギスIIIへ。仮面に隠した復讐と理想。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-00MS"
          }
        },
        {
          "match": {
            "code": "OZ-00MS2B"
          }
        }
      ]
    }
  },
  {
    "id": "w_tallgeese_line",
    "universe": "W",
    "no": 13,
    "group": "combo",
    "name": "トールギスの系譜",
    "sub": "全てのモビルスーツの祖、トールギス。初号機、トレーズが駆るII、ゼクスのIII。人間の限界を超える加速を強いる、栄光と呪いの系譜。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-00MS"
          }
        },
        {
          "match": {
            "code": "OZ-00MS2"
          }
        },
        {
          "match": {
            "code": "OZ-00MS2B"
          }
        }
      ]
    }
  },
  {
    "id": "w_treize",
    "universe": "W",
    "no": 14,
    "group": "combo",
    "name": "美しき野望",
    "sub": "トレーズ・クシュリナーダ、戦いに美学を求める貴公子。彼が駆るトールギスIIと、ゼロシステムを与えたエピオン。理想のために自ら散る、最も人間的な敵。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-00MS2"
          }
        },
        {
          "match": {
            "code": "OZ-13MS"
          }
        }
      ]
    }
  },
  {
    "id": "w_leo_master",
    "universe": "W",
    "no": 15,
    "group": "combo",
    "name": "リーオーの名手",
    "sub": "量産機リーオーひとつでガンダムと渡り合う、それがゼクスの腕。トールギスと並べれば分かる——名手は機体を選ばない。OZ随一のエースの矜持。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-00MS"
          }
        },
        {
          "match": {
            "code": "OZ-06MS"
          }
        }
      ]
    }
  },
  {
    "id": "w_wufei_treize",
    "universe": "W",
    "no": 16,
    "group": "combo",
    "name": "正義の在処",
    "sub": "強さこそ正義と信じる五飛が、真に強き者トレーズに挑む。アルトロンとトールギスII。勝利の果てに残ったのは、虚しさだった。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01S2"
          }
        },
        {
          "match": {
            "code": "OZ-00MS2"
          }
        }
      ]
    }
  },
  {
    "id": "w_tallgeese_f",
    "universe": "W",
    "no": 17,
    "group": "combo",
    "name": "トールギスF",
    "sub": "『敗者たちの栄光』が描く、改修されたトールギスF。原典のトールギスと並べて、もう一つのA.C.史を辿る。栄光は、敗者にも宿る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "トールギスF"
          }
        },
        {
          "match": {
            "code": "OZ-00MS",
            "nameExcludes": "トールギスF"
          }
        }
      ]
    }
  },
  {
    "id": "w_maganac",
    "universe": "W",
    "no": 18,
    "group": "combo",
    "name": "砂漠の盟友マグアナック",
    "sub": "カトルを慕う40人の戦士、マグアナック隊。サンドロックと量産機マグアナックが砂漠を駆ける。血の繋がりを超えた、もう一つの家族。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01SR"
          }
        },
        {
          "match": {
            "code": "WMS-03"
          }
        }
      ]
    }
  },
  {
    "id": "w_trowa_doll",
    "universe": "W",
    "no": 19,
    "group": "combo",
    "name": "操縦者、トロワ",
    "sub": "OZに潜入したトロワが、試作モビルドール『ヴァイエイト』のテストパイロットを務める。ヘビーアームズの主が、無人機の素体を操る皮肉。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01H"
          }
        },
        {
          "match": {
            "code": "OZ-13MSX1"
          }
        }
      ]
    }
  },
  {
    "id": "w_mobile_doll",
    "universe": "W",
    "no": 20,
    "group": "combo",
    "name": "無人機の脅威",
    "sub": "兵士の命を要さぬ無人機モビルドール。プロトタイプのヴァイエイト＆メリクリウスと、量産機リーオー。戦争を『作業』に変える、冷たい未来。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-13MSX1"
          }
        },
        {
          "match": {
            "code": "OZ-06MS"
          }
        }
      ]
    }
  },
  {
    "id": "w_quatre_trowa",
    "universe": "W",
    "no": 21,
    "group": "combo",
    "name": "静かなる二人",
    "sub": "心を読むカトルと、心を閉ざすトロワ。サンドロックとヘビーアームズ。言葉少なな二人が、いつしか最も深く理解し合う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01SR"
          }
        },
        {
          "match": {
            "code": "XXXG-01H"
          }
        }
      ]
    }
  },
  {
    "id": "w_leo_corps",
    "universe": "W",
    "no": 22,
    "group": "count",
    "name": "OZの主力、リーオー",
    "sub": "汎用量産機リーオー。宇宙仕様も飛行仕様も、外伝の派生機も——気づけば棚はOZ一色。3機で、地球圏統一機構の一兵卒に。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "OZ-06MS"
      },
      "gte": 3
    }
  },
  {
    "id": "w_heero_duo",
    "universe": "W",
    "no": 23,
    "group": "combo",
    "name": "潜入のヒイロとデュオ",
    "sub": "ウイングゼロとデスサイズヘル。完全兵士と死神、相反する二人が背中を預け合う。口は悪いが、誰より頼れる相棒同士。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "XXXG-01D2"
          }
        }
      ]
    }
  },
  {
    "id": "w_sanc",
    "universe": "W",
    "no": 24,
    "group": "combo",
    "name": "サンクキングダムの理想",
    "sub": "完全平和主義を掲げたサンクキングダム。妹リリーナの理想を、兄ミリアルドは武力で守ろうとする。ウイングゼロとトールギスIII、交わらぬ平和への道。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "OZ-00MS2B"
          }
        }
      ]
    }
  },
  {
    "id": "w_white_fang",
    "universe": "W",
    "no": 25,
    "group": "combo",
    "name": "ホワイトファングの叛旗",
    "sub": "宇宙の独立を掲げる組織ホワイトファング。リーブラ要塞を巡る最終決戦——ウイングゼロ、エピオン、トールギスIII。理想と理想がぶつかり合う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "OZ-13MS"
          }
        },
        {
          "match": {
            "code": "OZ-00MS2B"
          }
        }
      ]
    }
  },
  {
    "id": "w_geminass",
    "universe": "W",
    "no": 26,
    "group": "combo",
    "name": "G-UNITの双子",
    "sub": "外伝『DUAL STORY G-UNIT』のガンダム、ジェミナス01と02。MO-Vを舞台に、オデル・バーネットらが戦う。本編とは別の宇宙世紀の物語。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZX-GU01A"
          }
        },
        {
          "match": {
            "code": "OZX-GU02A"
          }
        }
      ]
    }
  },
  {
    "id": "w_lo_booster",
    "universe": "W",
    "no": 27,
    "group": "combo",
    "name": "L.O.ブースター換装",
    "sub": "ジェミナス01に高機動ユニットを装着したL.O.ブースター。素体と強化形態を並べ、G-UNITのメカニズムを堪能する玄人の一品。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZX-GU01A"
          }
        },
        {
          "match": {
            "code": "OZX-GU01ALOB"
          }
        }
      ]
    }
  },
  {
    "id": "w_leo_brothers",
    "universe": "W",
    "no": 28,
    "group": "combo",
    "name": "リーオー三兄弟",
    "sub": "G-UNITに登場するリーオーの派生機、レオン・レオール・レオス。量産機にも個性と物語を与える、外伝ならではの渋い面々。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-06MS-SN3"
          }
        },
        {
          "match": {
            "code": "OZ-06MS-SR2"
          }
        },
        {
          "match": {
            "code": "OZ-06MS-SS1"
          }
        }
      ]
    }
  },
  {
    "id": "w_oz_proto",
    "universe": "W",
    "no": 29,
    "group": "combo",
    "name": "OZ試作機の系譜",
    "sub": "G-UNITのOZ試作可変機、アスクレプオスとバーンレプオス。本編には現れぬ、もう一つのOZ兵器開発の枝葉。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-10VMSX"
          }
        },
        {
          "match": {
            "code": "OZ-10VMSX-2"
          }
        }
      ]
    }
  },
  {
    "id": "w_griep",
    "universe": "W",
    "no": 30,
    "group": "combo",
    "name": "グリープの巨影",
    "sub": "G-UNITの巨大モビルアーマー、グリープ。ジェミナス02と対峙させ、外伝の終局を立体で再現する。型録の最深部へようこそ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-19MASX"
          }
        },
        {
          "match": {
            "code": "OZX-GU02A"
          }
        }
      ]
    }
  },
  {
    "id": "w_proto_zero",
    "universe": "W",
    "no": 31,
    "group": "combo",
    "name": "プロトゼロ",
    "sub": "『敗者たちの栄光』が描く、ウイングゼロの原型機プロトゼロ。完成形のゼロと並べ、設計の試行錯誤を辿る。羽根を得る前の、剥き出しの翼。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "プロトゼロ"
          }
        },
        {
          "match": {
            "code": "XXXG-00W0",
            "nameExcludes": "プロトゼロ"
          }
        }
      ]
    }
  },
  {
    "id": "w_gol_equip",
    "universe": "W",
    "no": 32,
    "group": "combo",
    "name": "敗者たちの栄光・追加装備",
    "sub": "『敗者たちの栄光』仕様の追加武装。サンドロックのアーマディロ、ヘビーアームズのイーゲル。本編では見られぬ、if の重装備。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "アーマディロ"
          }
        },
        {
          "match": {
            "nameIncludes": "イーゲル"
          }
        }
      ]
    }
  },
  {
    "id": "w_gol_equip2",
    "universe": "W",
    "no": 33,
    "group": "combo",
    "name": "隠された武装",
    "sub": "デスサイズのルーセット、シェンロンのタウヤー。『敗者たちの栄光』が与えた、玄人向けの追加装備。プレバンの沼は深い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ルーセット"
          }
        },
        {
          "match": {
            "nameIncludes": "タウヤー"
          }
        }
      ]
    }
  },
  {
    "id": "w_endless",
    "universe": "W",
    "no": 34,
    "group": "combo",
    "name": "終わりなきワルツ、最終章",
    "sub": "マリーメイア事変。ウイングゼロ、デスサイズヘル、アルトロン——EW仕様の機体で、少年たちは『最後の戦争』に終止符を打つ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "XXXG-01D2"
          }
        },
        {
          "match": {
            "code": "XXXG-01S2"
          }
        }
      ]
    }
  },
  {
    "id": "w_self_destruct",
    "universe": "W",
    "no": 35,
    "group": "combo",
    "name": "自爆こそ、我が任務",
    "sub": "ヒイロは自らウイングを爆破し、トロワもヘビーアームズで散る覚悟を見せる。W名物・自爆の美学。少年兵たちの、あまりに重い決意。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-01W"
          }
        },
        {
          "match": {
            "code": "XXXG-01H"
          }
        }
      ]
    }
  },
  {
    "id": "w_three_aces",
    "universe": "W",
    "no": 36,
    "group": "combo",
    "name": "三人の頂点",
    "sub": "ヒイロのウイングゼロ、ゼクスのトールギス、そしてエピオン。A.C.世界の最強を巡る三つ巴。剣・翼・加速、それぞれの極致。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XXXG-00W0"
          }
        },
        {
          "match": {
            "code": "OZ-00MS"
          }
        },
        {
          "match": {
            "code": "OZ-13MS"
          }
        }
      ]
    }
  },
  {
    "id": "w_verka",
    "universe": "W",
    "no": 37,
    "group": "combo",
    "name": "カトキ立体の競演",
    "sub": "カトキハジメによるVer.Ka。ウイングガンダムとウイングゼロ、二つのVer.Kaを並べる。緻密なディテールとプロポーション、設定画の理想像。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameAll": [
              "ウイングガンダム",
              "Ver.Ka"
            ],
            "nameExcludes": "ゼロ"
          }
        },
        {
          "match": {
            "nameAll": [
              "ゼロ",
              "Ver.Ka"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "w_coating",
    "universe": "W",
    "no": 38,
    "group": "count",
    "name": "スペシャルコーティング商法",
    "sub": "スペシャルコーティング、パールミラー、チタニウムフィニッシュ。同じ機体が光沢を変えて何度も並ぶ。2機で、メッキの誘惑に屈した証。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "コーティング",
        "series": "ガンダムW"
      },
      "gte": 2
    }
  },
  {
    "id": "w_epyon_duel",
    "universe": "W",
    "no": 39,
    "group": "combo",
    "name": "剣と鞭の決闘",
    "sub": "近接特化のエピオンが、ヒート・ロッドの鞭とビームソードで斬りかかる。デスサイズヘルとの闇の斬り合い——白兵戦こそA.C.の華。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "OZ-13MS"
          }
        },
        {
          "match": {
            "code": "XXXG-01D2"
          }
        }
      ]
    }
  },
  {
    "id": "w_all_wing",
    "universe": "W",
    "no": 40,
    "group": "count",
    "name": "A.C.全機制覇",
    "sub": "TVもEWも、敗者たちの栄光もG-UNITも。縮尺も版も問わず、After Colony の機体を18機。コロニーから地球まで、君の棚が戦場になる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ガンダムW"
      },
      "gte": 18
    }
  },
  {
    "id": "x_garrod",
    "universe": "X",
    "no": 1,
    "group": "combo",
    "name": "ガロード・ランの軌跡",
    "sub": "戦争を生き抜く少年ガロード・ランの愛機の変遷。ガンダムX、近接戦のディバイダー、そして双砲のダブルエックス。拾い屋の少年が、世界の運命を背負う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GX-9900",
            "nameExcludes": "3号機"
          }
        },
        {
          "match": {
            "code": "GX-9900-DV"
          }
        },
        {
          "match": {
            "code": "GX-9901-DX"
          }
        }
      ]
    }
  },
  {
    "id": "x_satellite",
    "universe": "X",
    "no": 2,
    "group": "combo",
    "name": "月は出ているか？",
    "sub": "月面のマイクロウェーブ送信施設から力を得る、サテライトキャノン。ガンダムXとダブルエックスがGビットを展開し、月光をエネルギーに変える。発射の合言葉。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GX-9900",
            "nameExcludes": "3号機"
          }
        },
        {
          "match": {
            "code": "GX-9901-DX"
          }
        }
      ]
    }
  },
  {
    "id": "x_divider",
    "universe": "X",
    "no": 3,
    "group": "combo",
    "name": "接近戦への換装",
    "sub": "サテライトキャノンを失ったガンダムXが、ディバイダーへと姿を変える。背中の大盾とハーモニカ砲で接近戦を制す、ガロードの実戦的な選択。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GX-9900",
            "nameExcludes": "3号機"
          }
        },
        {
          "match": {
            "code": "GX-9900-DV"
          }
        }
      ]
    }
  },
  {
    "id": "x_double_cannon",
    "universe": "X",
    "no": 4,
    "group": "combo",
    "name": "ツインサテライトキャノン",
    "sub": "二門のサテライトキャノンを備えたガンダムダブルエックス。ディバイダーと並べ、ガロード機の到達点を堪能する。月の力、二倍の威力。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GX-9901-DX"
          }
        },
        {
          "match": {
            "code": "GX-9900-DV"
          }
        }
      ]
    }
  },
  {
    "id": "x_witz",
    "universe": "X",
    "no": 5,
    "group": "combo",
    "name": "ヴィッツの空戦",
    "sub": "ガンダムチームの空の戦士ヴィッツ・スー。可変機ガンダムエアマスターと、強化形態エアマスターバースト。大空を駆ける、軽快な翼。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GW-9800"
          }
        },
        {
          "match": {
            "code": "GW-9800-B"
          }
        }
      ]
    }
  },
  {
    "id": "x_gundam_team",
    "universe": "X",
    "no": 6,
    "group": "combo",
    "name": "ガンダムチーム",
    "sub": "宇宙海賊船フリーデンに集う、ガロードのガンダムX、ヴィッツのエアマスター、そしてダブルエックス。ニュータイプを巡る戦いに身を投じる、若き戦士たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GX-9900",
            "nameExcludes": "3号機"
          }
        },
        {
          "match": {
            "code": "GW-9800"
          }
        },
        {
          "match": {
            "code": "GX-9901-DX"
          }
        }
      ]
    }
  },
  {
    "id": "x_newtype",
    "universe": "X",
    "no": 7,
    "group": "combo",
    "name": "ニュータイプの果てに",
    "sub": "ダブルエックスとエアマスターバースト、決戦の機体たち。ニュータイプとは何か——その問いに、ガロードとティファは『人と人の理解』で答えを出す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GX-9901-DX"
          }
        },
        {
          "match": {
            "code": "GW-9800-B"
          }
        }
      ]
    }
  },
  {
    "id": "x_unit3",
    "universe": "X",
    "no": 8,
    "group": "combo",
    "name": "ガンダムX3号機",
    "sub": "もう一機のガンダムX、3号機。原典のXと並べ、第7次宇宙戦争に投入された量産前提機の系譜を辿る。フリーデンの予備戦力。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "X3号機"
          }
        },
        {
          "match": {
            "code": "GX-9900",
            "nameExcludes": "3号機"
          }
        }
      ]
    }
  },
  {
    "id": "x_dortress",
    "universe": "X",
    "no": 9,
    "group": "combo",
    "name": "ニュータイプ狩り",
    "sub": "新地球連邦の量産機ドートレスと、ガンダムX。ニュータイプを脅威とみなし狩り立てる軍と、それに抗うガンダム。15年後の世界の縮図。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "DT-6800"
          }
        },
        {
          "match": {
            "code": "GX-9900",
            "nameExcludes": "3号機"
          }
        }
      ]
    }
  },
  {
    "id": "x_master",
    "universe": "X",
    "no": 10,
    "group": "count",
    "name": "A.W.の漂流者",
    "sub": "機動新世紀ガンダムXの機体を6機。荒廃した戦後の地球を彷徨うフリーデンの旅路を、君は棚の上に再現する。ニュータイプ神話の、その先へ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "機動新世紀ガンダムX",
        "accessory": true
      },
      "gte": 6
    }
  },
  {
    "id": "oo_setsuna",
    "universe": "00",
    "no": 1,
    "group": "combo",
    "name": "俺がガンダムだ",
    "sub": "刹那・F・セイエイの愛機の変遷。エクシア、ダブルオー、そしてダブルオークアンタ。ガンダムに救われた少年が、自らガンダムとなり、対話の象徴となる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-001"
          }
        },
        {
          "match": {
            "code": "GN-0000"
          }
        },
        {
          "match": {
            "code": "GNT-0000"
          }
        }
      ]
    }
  },
  {
    "id": "oo_lockon",
    "universe": "00",
    "no": 2,
    "group": "combo",
    "name": "狙い撃つぜ",
    "sub": "二人のロックオン・ストラトス。兄ニールのデュナメスから、弟ライルのケルディム、そしてザバーニャへ。ディランディ兄弟が受け継ぐ、狙撃の誇り。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-002"
          }
        },
        {
          "match": {
            "codePrefix": "GN-006"
          }
        },
        {
          "match": {
            "code": "GN-010"
          }
        }
      ]
    }
  },
  {
    "id": "oo_allelujah",
    "universe": "00",
    "no": 3,
    "group": "combo",
    "name": "アレルヤとマリー",
    "sub": "アレルヤ・ハプティズムの可変機の系譜。キュリオス、アリオス、そしてマリーと共に駆るハルート。二つの人格と、二人で一つの物語。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-003"
          }
        },
        {
          "match": {
            "codePrefix": "GN-007"
          }
        },
        {
          "match": {
            "code": "GN-011"
          }
        }
      ]
    }
  },
  {
    "id": "oo_tieria",
    "universe": "00",
    "no": 4,
    "group": "combo",
    "name": "ティエリアの祈り",
    "sub": "イノベイド、ティエリア・アーデの機体。重装のヴァーチェ、巨腕のセラヴィー、そして劇場版のラファエル。ヴェーダと共に在る者の、静かな献身。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-005"
          }
        },
        {
          "match": {
            "codePrefix": "GN-008"
          }
        },
        {
          "match": {
            "code": "CB-002"
          }
        }
      ]
    }
  },
  {
    "id": "oo_s1_meisters",
    "universe": "00",
    "no": 5,
    "group": "combo",
    "name": "我々は、武力介入を行う",
    "sub": "第1世代ガンダム——エクシア、デュナメス、キュリオス、ヴァーチェ。戦争根絶を掲げ、世界に牙を剥いたソレスタルビーイングの始まり。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-001"
          }
        },
        {
          "match": {
            "code": "GN-002"
          }
        },
        {
          "match": {
            "code": "GN-003"
          }
        },
        {
          "match": {
            "code": "GN-005"
          }
        }
      ]
    }
  },
  {
    "id": "oo_s2_meisters",
    "universe": "00",
    "no": 6,
    "group": "combo",
    "name": "第2世代、再臨",
    "sub": "4年の沈黙を経て甦った第2世代——ダブルオー、ケルディム、アリオス、セラヴィー。アロウズの抑圧に抗い、マイスターたちが再び集う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-0000"
          }
        },
        {
          "match": {
            "codePrefix": "GN-006"
          }
        },
        {
          "match": {
            "codePrefix": "GN-007"
          }
        },
        {
          "match": {
            "codePrefix": "GN-008"
          }
        }
      ]
    }
  },
  {
    "id": "oo_movie_meisters",
    "universe": "00",
    "no": 7,
    "group": "combo",
    "name": "トレイルブレイザー",
    "sub": "劇場版、未知との対話。クアンタ、ザバーニャ、ハルート、ラファエル。武力では届かぬ相手ELSと、刹那たちは新たな道を切り拓く。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNT-0000"
          }
        },
        {
          "match": {
            "code": "GN-010"
          }
        },
        {
          "match": {
            "code": "GN-011"
          }
        },
        {
          "match": {
            "code": "CB-002"
          }
        }
      ]
    }
  },
  {
    "id": "oo_raiser",
    "universe": "00",
    "no": 8,
    "group": "combo",
    "name": "ダブルオー、ライザー！",
    "sub": "二つの太陽炉が共鳴するツインドライヴ・システム。ダブルオーガンダムとオーライザーが合体し、奇跡の出力を生む。刹那の到達点の一つ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダブルオーガンダム",
            "nameExcludes": [
              "ライザー",
              "セブンソード",
              "クアンタ"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "オーライザー",
            "nameExcludes": "ダブルオー"
          }
        }
      ]
    }
  },
  {
    "id": "oo_seven_sword",
    "universe": "00",
    "no": 9,
    "group": "combo",
    "name": "セブンソード",
    "sub": "ダブルオーガンダム セブンソード/G。七つの剣で武装した接近戦特化形態と、ダブルオーライザー。外伝が描く、刹那機のもう一つの可能性。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "セブンソード"
          }
        },
        {
          "match": {
            "nameIncludes": "ダブルオーライザー"
          }
        }
      ]
    }
  },
  {
    "id": "oo_exia_line",
    "universe": "00",
    "no": 10,
    "group": "combo",
    "name": "エクシアの系譜",
    "sub": "刹那の原点エクシアと、その姿を変えた機体たち。アヴァランチエクシア、リペア。傷つき、組み直されてなお戦い続ける、GNソードの剣士。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-001"
          }
        },
        {
          "match": {
            "codePrefix": "GN-001/hs"
          }
        },
        {
          "match": {
            "codePrefix": "GN-001RE"
          }
        }
      ]
    }
  },
  {
    "id": "oo_zero_gundam",
    "universe": "00",
    "no": 11,
    "group": "combo",
    "name": "0ガンダムとの邂逅",
    "sub": "戦場の少年だった刹那が見た、白いガンダム——0ガンダム。後にエクシアを駆る彼の運命を決めた、全ての始まりの機体。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-000"
          }
        },
        {
          "match": {
            "code": "GN-001"
          }
        }
      ]
    }
  },
  {
    "id": "oo_lockon_revenge",
    "universe": "00",
    "no": 12,
    "group": "combo",
    "name": "兄の仇",
    "sub": "家族を奪った男アリー・アル・サーシェスを追う、ニール・ロックオン。デュナメスのスナイパーライフルが、スローネツヴァイを狙う。復讐の引き金。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-002"
          }
        },
        {
          "match": {
            "code": "GNW-002"
          }
        }
      ]
    }
  },
  {
    "id": "oo_gn_archer",
    "universe": "00",
    "no": 13,
    "group": "combo",
    "name": "ライルとフェルト",
    "sub": "弟ライルのケルディムと、フェルトが駆るGNアーチャー。ケルディムから分離・支援するこの機体に、新たな仲間との絆が宿る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "GN-006"
          }
        },
        {
          "match": {
            "code": "GNR-101A"
          }
        }
      ]
    }
  },
  {
    "id": "oo_graham_flag",
    "universe": "00",
    "no": 14,
    "group": "combo",
    "name": "グラハム・スペシャル",
    "sub": "ユニオンの撃墜王グラハム・エーカー。量産機フラッグを、人機一体の妙技『グラハム・スペシャル』で乗りこなす。専用カスタムが、彼の誇り。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "SVMS-01"
          }
        },
        {
          "match": {
            "code": "SVMS-01E"
          }
        }
      ]
    }
  },
  {
    "id": "oo_mr_bushido",
    "universe": "00",
    "no": 15,
    "group": "combo",
    "name": "我が名はミスター・ブシドー",
    "sub": "仮面の侍ミスター・ブシドーへと変貌したグラハム。スサノオとマスラオ、武士道精神を宿した機体で、刹那との決着を求め続ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNX-U02X"
          }
        },
        {
          "match": {
            "code": "GNX-Y901TW"
          }
        }
      ]
    }
  },
  {
    "id": "oo_setsuna_vs_graham",
    "universe": "00",
    "no": 16,
    "group": "combo",
    "name": "宿命の好敵手",
    "sub": "エクシアとグラハム専用フラッグ。最初の邂逅から最後まで、刹那とグラハムは互いを高め合う宿敵であり続けた。ガンダムを巡る、終わらぬ問答。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-001"
          }
        },
        {
          "match": {
            "code": "SVMS-01E"
          }
        }
      ]
    }
  },
  {
    "id": "oo_brave",
    "universe": "00",
    "no": 17,
    "group": "combo",
    "name": "ブレイヴ、出撃",
    "sub": "劇場版でグラハムが駆る最新鋭機ブレイヴ。指揮官用と一般用の試験機。地球連邦の刃として、ELSとの最終決戦に身を投じる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNX-903VW"
          }
        },
        {
          "match": {
            "code": "GNX-903VS"
          }
        }
      ]
    }
  },
  {
    "id": "oo_trinity",
    "universe": "00",
    "no": 18,
    "group": "combo",
    "name": "トリニティ三兄妹",
    "sub": "第2のソレスタルビーイングを騙る兄妹、トリニティ。スローネ・アイン、ツヴァイ、ドライ。無差別な『武力介入』が、世界に混沌をもたらす。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNW-001"
          }
        },
        {
          "match": {
            "code": "GNW-002"
          }
        },
        {
          "match": {
            "code": "GNW-003"
          }
        }
      ]
    }
  },
  {
    "id": "oo_ali_arche",
    "universe": "00",
    "no": 19,
    "group": "combo",
    "name": "戦争の亡霊",
    "sub": "戦場を渡り歩く傭兵アリー・アル・サーシェス。スローネツヴァイを乗り回し、後にアルケーガンダムで暴れ狂う。憎しみの連鎖を体現する男。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNW-20000"
          }
        },
        {
          "match": {
            "code": "GNW-002"
          }
        }
      ]
    }
  },
  {
    "id": "oo_reborns",
    "universe": "00",
    "no": 20,
    "group": "combo",
    "name": "リボンズ・アルマーク",
    "sub": "イノベイターを率いる黒幕リボンズ。かつて0ガンダムを駆り、最後はリボーンズガンダムで刹那に挑む。人類を導くと信じた者の、傲慢。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CB-0000G/C"
          }
        },
        {
          "match": {
            "code": "GN-000"
          }
        }
      ]
    }
  },
  {
    "id": "oo_innovators",
    "universe": "00",
    "no": 21,
    "group": "combo",
    "name": "イノベイターの尖兵",
    "sub": "リボンズに従うイノベイターたちの機体。ガデッサ、ガラッゾ、ガッデス。疑似太陽炉を積み、念じるままに動く——人を超えた者たちの戦い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNZ-003"
          }
        },
        {
          "match": {
            "code": "GNZ-005"
          }
        },
        {
          "match": {
            "code": "GNZ-007"
          }
        }
      ]
    }
  },
  {
    "id": "oo_final_battle",
    "universe": "00",
    "no": 22,
    "group": "combo",
    "name": "決戦、刹那 vs リボンズ",
    "sub": "ダブルオーライザーとリボーンズガンダム。世界の行く末を賭けた最終決戦。導く者と、対話を選ぶ者——二つの未来が激突する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダブルオーライザー"
          }
        },
        {
          "match": {
            "code": "CB-0000G/C"
          }
        }
      ]
    }
  },
  {
    "id": "oo_pseudo_drive",
    "universe": "00",
    "no": 23,
    "group": "combo",
    "name": "疑似太陽炉",
    "sub": "ソレスタルビーイングの技術を奪い、国連が量産したジンクスとアヘッド。疑似太陽炉という劣化コピーが、ガンダムの優位を切り崩していく。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNX-603T"
          }
        },
        {
          "match": {
            "code": "GNX-704T"
          }
        }
      ]
    }
  },
  {
    "id": "oo_gnx_line",
    "universe": "00",
    "no": 24,
    "group": "combo",
    "name": "ジンクスの系譜",
    "sub": "ジンクス、アドヴァンスド、III、IV。世代を重ねて進化する量産GN機。数の暴力で、ガンダムを追い詰める連邦・アロウズの主力。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNX-603T"
          }
        },
        {
          "match": {
            "code": "GNX-604T"
          }
        },
        {
          "match": {
            "code": "GNX-609T"
          }
        },
        {
          "match": {
            "code": "GNX-803T"
          }
        }
      ]
    }
  },
  {
    "id": "oo_ahead",
    "universe": "00",
    "no": 25,
    "group": "combo",
    "name": "アヘッドの強者たち",
    "sub": "アロウズの新主力アヘッド。一般機、ブシドー専用、スマルトロン。エースたちが乗り込み、第2世代マイスターの前に立ちはだかる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNX-704T"
          }
        },
        {
          "match": {
            "code": "GNX-704T/AC"
          }
        },
        {
          "match": {
            "code": "GNX-704T/SP"
          }
        }
      ]
    }
  },
  {
    "id": "oo_three_nations",
    "universe": "00",
    "no": 26,
    "group": "combo",
    "name": "三大国家群",
    "sub": "ソレスタルビーイングに対抗する世界の三勢力。ユニオンのフラッグ、AEUのイナクト、人類革新連盟のティエレン。それぞれの正義がぶつかる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "SVMS-01"
          }
        },
        {
          "match": {
            "code": "AEU-09"
          }
        },
        {
          "match": {
            "codePrefix": "MSJ-06II"
          }
        }
      ]
    }
  },
  {
    "id": "oo_tieren",
    "universe": "00",
    "no": 27,
    "group": "combo",
    "name": "人類革新連盟の鋼",
    "sub": "重厚な人型兵器ティエレン。地上型、宇宙型、タオツー。泥臭くも堅実なHRLの主力が、戦場を埋め尽くす。リアルロボットの趣。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSJ-06II-A"
          }
        },
        {
          "match": {
            "code": "MSJ-06II-E"
          }
        },
        {
          "match": {
            "code": "MSJ-06II-SP"
          }
        }
      ]
    }
  },
  {
    "id": "oo_sergei",
    "universe": "00",
    "no": 28,
    "group": "combo",
    "name": "ロシアの英雄、セルゲイ",
    "sub": "歴戦の勇士セルゲイ・スミルノフ専用ティエレンタオツーと、一般機。『鋼鉄の薔薇』と呼ばれた老兵の、誇り高き戦いぶり。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSJ-06III-A"
          }
        },
        {
          "match": {
            "codePrefix": "MSJ-06II"
          }
        }
      ]
    }
  },
  {
    "id": "oo_ali_enact",
    "universe": "00",
    "no": 29,
    "group": "combo",
    "name": "傭兵稼業",
    "sub": "サーシェス専用AEUイナクトカスタムと、スローネツヴァイ。金と戦場を渡り歩くアリーが乗り捨ててきた、数々の機体。戦争という商売。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "AEU-09Y812"
          }
        },
        {
          "match": {
            "code": "GNW-002"
          }
        }
      ]
    }
  },
  {
    "id": "oo_astraea",
    "universe": "00",
    "no": 30,
    "group": "combo",
    "name": "第1世代の試作機",
    "sub": "外伝『00P/00F』が描く、エクシアの前身ガンダムアストレア。素体とタイプF。ソレスタルビーイング黎明期の、知られざる開発史。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNY-001"
          }
        },
        {
          "match": {
            "code": "GNY-001F",
            "nameExcludes": "1.5"
          }
        }
      ]
    }
  },
  {
    "id": "oo_plutone",
    "universe": "00",
    "no": 31,
    "group": "combo",
    "name": "プルトーネの悲劇",
    "sub": "外伝『00P』の機体ガンダムプルトーネと、アストレア。太陽炉の暴走事故という、ソレスタルビーイングが背負った最初の犠牲。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "GNY-004"
          }
        },
        {
          "match": {
            "code": "GNY-001"
          }
        }
      ]
    }
  },
  {
    "id": "oo_onefive",
    "universe": "00",
    "no": 32,
    "group": "combo",
    "name": "1.5ガンダム",
    "sub": "第1世代と第2世代の橋渡し、1.5(アイズ)ガンダム。アストレアタイプFと並べ、ガンダム開発の系統樹を埋める外伝の妙味。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNY-001F",
            "nameIncludes": "1.5"
          }
        },
        {
          "match": {
            "code": "GNY-001F",
            "nameExcludes": "1.5"
          }
        }
      ]
    }
  },
  {
    "id": "oo_qant_fullsaber",
    "universe": "00",
    "no": 33,
    "group": "combo",
    "name": "クアンタ、完全武装",
    "sub": "外伝『00V戦記』のダブルオークアンタフルセイバー。本来のクアンタに重武装を施した、もしもの完全戦闘形態。GNソードの極致。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNT-0000/FS"
          }
        },
        {
          "match": {
            "code": "GNT-0000"
          }
        }
      ]
    }
  },
  {
    "id": "oo_quantum_burst",
    "universe": "00",
    "no": 34,
    "group": "combo",
    "name": "クアンタムバースト",
    "sub": "ダブルオークアンタとダブルオーライザー。ツインドライヴが生む量子の波が、人と人の意識を繋ぐ。刹那がイノベイターへと変革する、その瞬間。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GNT-0000"
          }
        },
        {
          "match": {
            "nameIncludes": "ダブルオーライザー"
          }
        }
      ]
    }
  },
  {
    "id": "oo_nadleeh_seraphim",
    "universe": "00",
    "no": 35,
    "group": "combo",
    "name": "秘めたる素顔",
    "sub": "ヴァーチェの中に隠されたナドレ、セラヴィーの中のセラフィム。ティエリアの機体は、装甲の下にもう一つの顔を持つ。トライアル・システムの番人。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GN-004"
          }
        },
        {
          "match": {
            "code": "GN-009"
          }
        }
      ]
    }
  },
  {
    "id": "oo_gnhw",
    "universe": "00",
    "no": 36,
    "group": "combo",
    "name": "GNHW、武装強化",
    "sub": "第2世代の追加武装形態GNHW。ケルディムのR、アリオスのM、セラヴィーのB。継戦能力を高めた、決戦仕様の重装たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "GNHW/R"
          }
        },
        {
          "match": {
            "nameIncludes": "GNHW/M"
          }
        },
        {
          "match": {
            "nameIncludes": "GNHW/B"
          }
        }
      ]
    }
  },
  {
    "id": "oo_transam",
    "universe": "00",
    "no": 37,
    "group": "count",
    "name": "トランザム！",
    "sub": "GN粒子を一時的に爆発させる赤い加速、トランザム。その瞬間を捉えたモードVer.を3機。真紅に染まった機体が、限界を超える。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "トランザム",
        "series": "機動戦士ガンダム00"
      },
      "gte": 3
    }
  },
  {
    "id": "oo_gn_drive",
    "universe": "00",
    "no": 38,
    "group": "count",
    "name": "太陽炉の輝き",
    "sub": "GN粒子を生む太陽炉を積んだ機体を20機。ソレスタルビーイングも国連も、この緑の光を巡って戦った。A.D.の戦史が、棚に広がる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "GN",
        "series": "機動戦士ガンダム00"
      },
      "gte": 20
    }
  },
  {
    "id": "oo_master",
    "universe": "00",
    "no": 39,
    "group": "count",
    "name": "A.D.の探究者",
    "sub": "GN粒子の機体を30機。1期も2期も劇場版も外伝も、ガンダム00という物語を、君は丸ごと組み上げた。対話の先へ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "GN",
        "series": "機動戦士ガンダム00"
      },
      "gte": 30
    }
  },
  {
    "id": "oo_gross",
    "universe": "00",
    "no": 40,
    "group": "count",
    "name": "グロスインジェクション商法",
    "sub": "トランザムモードのグロスインジェクションVer.を3機。同じ機体が艶めく赤で何度も並ぶ——光沢の誘惑に、つい財布が緩む。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "グロスインジェクション",
        "series": "機動戦士ガンダム00"
      },
      "gte": 3
    }
  },
  {
    "id": "age_asuno_three",
    "universe": "AGE",
    "no": 1,
    "group": "combo",
    "name": "アスノ三代の物語",
    "sub": "祖父フリット、父アセム、孫キオ。三世代に渡ってガンダムを受け継ぐアスノ家。AGE-1・AGE-2・AGE-3——百年戦争を貫く、一つの血脈の叙事詩。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-1"
          }
        },
        {
          "match": {
            "code": "AGE-2"
          }
        },
        {
          "match": {
            "code": "AGE-3"
          }
        }
      ]
    }
  },
  {
    "id": "age_wear_system",
    "universe": "AGE",
    "no": 2,
    "group": "combo",
    "name": "AGEシステム、起動",
    "sub": "戦況に応じて姿を変えるウェアシステム。AGE-1のノーマル、剛腕のタイタス、俊足のスパロー。少年フリットの願いが生んだ、進化するガンダム。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-1"
          }
        },
        {
          "match": {
            "code": "AGE-1T"
          }
        },
        {
          "match": {
            "code": "AGE-1S"
          }
        }
      ]
    }
  },
  {
    "id": "age_flit",
    "universe": "AGE",
    "no": 3,
    "group": "combo",
    "name": "フリットの執念",
    "sub": "ユリンを喪い、ヴェイガンへの憎しみを抱き続けた男フリット。AGE-1ノーマルから、老いてなお駆るフルグランサへ。執念が、三世代を動かす。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-1"
          }
        },
        {
          "match": {
            "codePrefix": "AGE-1G"
          }
        }
      ]
    }
  },
  {
    "id": "age_asem",
    "universe": "AGE",
    "no": 4,
    "group": "combo",
    "name": "キャプテン・アッシュ",
    "sub": "父を超えられぬと悩んだアセムが、宇宙海賊『キャプテン・アッシュ』として生きる。AGE-2ノーマル、ダブルバレット、そして黒きダークハウンド。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-2"
          }
        },
        {
          "match": {
            "code": "AGE-2DB"
          }
        },
        {
          "match": {
            "code": "AGE-2DH"
          }
        }
      ]
    }
  },
  {
    "id": "age_kio",
    "universe": "AGE",
    "no": 5,
    "group": "combo",
    "name": "キオの選択",
    "sub": "憎しみの連鎖を断とうとする第三世代キオ。AGE-3のノーマル、フォートレス、オービタル。祖父とは違う道——和解を信じる、少年の理想。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-3"
          }
        },
        {
          "match": {
            "code": "AGE-3F"
          }
        },
        {
          "match": {
            "code": "AGE-3O"
          }
        }
      ]
    }
  },
  {
    "id": "age_fx",
    "universe": "AGE",
    "no": 6,
    "group": "combo",
    "name": "AGE-FX、Cファンネル",
    "sub": "AGEシステムの到達点、ガンダムAGE-FX。Cファンネルを操る最終機と、その前身AGE-3。Xラウンダー・キオの力を、極限まで引き出す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-FX"
          }
        },
        {
          "match": {
            "code": "AGE-3"
          }
        }
      ]
    }
  },
  {
    "id": "age_zeheart",
    "universe": "AGE",
    "no": 7,
    "group": "combo",
    "name": "ゼハートのレジルス",
    "sub": "ヴェイガンの切り札ゼハート・ガレット。ゼイドラから、白きガンダムレギルスへ。理想のために祖国に殉じる、もう一人の主人公。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "xvm-zgc"
          }
        },
        {
          "match": {
            "codePrefix": "xvm-fzc"
          }
        }
      ]
    }
  },
  {
    "id": "age_academy",
    "universe": "AGE",
    "no": 8,
    "group": "combo",
    "name": "アカデミーの友",
    "sub": "士官学校で親友だったアセムとゼハート。AGE-2とゼイドラ。地球とヴェイガン、立場が二人を引き裂く。友情と使命の、痛切な対立。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-2"
          }
        },
        {
          "match": {
            "code": "xvm-zgc"
          }
        }
      ]
    }
  },
  {
    "id": "age_yurin",
    "universe": "AGE",
    "no": 9,
    "group": "combo",
    "name": "ユリンの想い",
    "sub": "フリットを慕い、Xラウンダーの力で彼を守った少女ユリン。AGE-1と、彼女が乗せられたファルシア。叶わぬ初恋が、一つの戦いを終わらせる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-1"
          }
        },
        {
          "match": {
            "code": "xvd-xd"
          }
        }
      ]
    }
  },
  {
    "id": "age_desil",
    "universe": "AGE",
    "no": 10,
    "group": "combo",
    "name": "デシルの哄笑",
    "sub": "幼くしてエースだったヴェイガンの少年デシル・ガレット。ゼイドラでユリンを手にかけ、フリットの心に消えぬ憎しみを刻む。AGE-1との因縁。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-1"
          }
        },
        {
          "match": {
            "code": "xvm-zgc"
          }
        }
      ]
    }
  },
  {
    "id": "age_xrounder",
    "universe": "AGE",
    "no": 11,
    "group": "combo",
    "name": "Xラウンダー",
    "sub": "空間を超えて感応する力、Xラウンダー。キオのAGE-FXとゼハートのレギルス。最高位の感応者同士がぶつかり、戦いの果てに理解へと至る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "AGE-FX"
          }
        },
        {
          "match": {
            "codePrefix": "xvm-fzc"
          }
        }
      ]
    }
  },
  {
    "id": "age_vagan_vanguard",
    "universe": "AGE",
    "no": 12,
    "group": "combo",
    "name": "ヴェイガンの牙",
    "sub": "謎の敵UE——その正体は火星の棄民ヴェイガン。可変機ガフラン、重装ゼダス、飛行ドラド。怨念を抱いた者たちが、地球へ牙を剥く。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ovv-f"
          }
        },
        {
          "match": {
            "code": "xvv-xc"
          }
        },
        {
          "match": {
            "code": "OVM-E"
          }
        }
      ]
    }
  },
  {
    "id": "age_zedas",
    "universe": "AGE",
    "no": 13,
    "group": "combo",
    "name": "ゼダスの系譜",
    "sub": "ヴェイガンのエース格ゼダスと、改良型ゼダスR。鋭い爪と機動力で、ガンダムに食らいつく。世代を重ねて磨かれた、敵機の意地。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "xvv-xc"
          }
        },
        {
          "match": {
            "code": "xvv-xcr"
          }
        }
      ]
    }
  },
  {
    "id": "age_danazine",
    "universe": "AGE",
    "no": 14,
    "group": "combo",
    "name": "竜の機体ダナジン",
    "sub": "キオ編に現れる竜型モビルスーツ、ダナジンとギラーガ。獣のような機体で襲い来るヴェイガン精鋭。火星の怒りが、異形となって顕れる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "ovv-af"
          }
        },
        {
          "match": {
            "code": "xvt-zgc"
          }
        }
      ]
    }
  },
  {
    "id": "age_farsia",
    "universe": "AGE",
    "no": 15,
    "group": "combo",
    "name": "ファルシアの系譜",
    "sub": "Xラウンダー専用のビット機ファルシアと、フォーンファルシア。感応波で誘導される無数の刃。少女たちが背負わされた、悲しき兵器。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "xvd-xd"
          }
        },
        {
          "match": {
            "code": "xvb-fnc"
          }
        }
      ]
    }
  },
  {
    "id": "age_fed_three",
    "universe": "AGE",
    "no": 16,
    "group": "combo",
    "name": "連邦三世代の量産機",
    "sub": "百年の戦いを支えた連邦の量産機。フリット世代のジェノアス、アセム世代のアデル、キオ世代のクランシェ。技術は、世代と共に進む。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "RGE-B790"
          }
        },
        {
          "match": {
            "code": "RGE-G1100"
          }
        },
        {
          "match": {
            "code": "RGE-G2100"
          }
        }
      ]
    }
  },
  {
    "id": "age_genoace",
    "universe": "AGE",
    "no": 17,
    "group": "combo",
    "name": "ジェノアスの系譜",
    "sub": "連邦軍の初期主力ジェノアス。一般機、カスタム、そしてジェノアスII。ガンダムの影で地道に戦い続けた、名もなき兵士たちの相棒。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "RGE-B790"
          }
        },
        {
          "match": {
            "code": "RGE-B790CW"
          }
        },
        {
          "match": {
            "code": "RGE-B890"
          }
        }
      ]
    }
  },
  {
    "id": "age_gexes",
    "universe": "AGE",
    "no": 18,
    "group": "combo",
    "name": "ウルフのGエグゼス",
    "sub": "『白い狼』ウルフ・エニアクルが駆るGエグゼスと、発展機ジャックエッジ。フリットの師にして憧れ。エースの矜持を体現する、軽快な機体。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "WMS-GEX1"
          }
        },
        {
          "match": {
            "code": "BMS-004"
          }
        }
      ]
    }
  },
  {
    "id": "age_sid",
    "universe": "AGE",
    "no": 19,
    "group": "combo",
    "name": "追憶のシド",
    "sub": "外伝『追憶のシド』が描く、AGEシステムの起源を巡る物語。シャルドール ローグとGサイフォス。本編の遥か前、伝説の機体『シド』の真実。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "BMS-003"
          }
        },
        {
          "match": {
            "code": "BMS-005"
          }
        }
      ]
    }
  },
  {
    "id": "age_master",
    "universe": "AGE",
    "no": 20,
    "group": "count",
    "name": "A.G.の語り部",
    "sub": "ガンダムAGEの機体を15機。アスノ家の三世代も、ヴェイガンの怨念も、連邦の量産機も。百年に渡る戦いの物語を、君は丸ごと棚に収めた。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ガンダムAGE",
        "accessory": true
      },
      "gte": 15
    }
  },
  {
    "id": "ibo_barbatos_forms",
    "universe": "IBO",
    "no": 1,
    "group": "combo",
    "name": "鉄と血と",
    "sub": "三日月・オーグスの相棒バルバトスの変遷。素体から、ルプス、ルプスレクスへ。戦うたびに鋭く、獣のように変わりゆく、鉄華団の魂。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "バルバトス",
            "nameExcludes": [
              "ルプス",
              "第6形態",
              "アダプト",
              "クリア",
              "コーティング",
              "拡張"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "ルプス",
            "nameExcludes": [
              "レクス",
              "クリア",
              "拡張"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "ルプスレクス"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_dont_stop",
    "universe": "IBO",
    "no": 2,
    "group": "combo",
    "name": "止まるんじゃねぞ…",
    "sub": "オルガ・イツカの最期の言葉。彼が掲げた鉄華団の旗を、三日月のバルバトスが背負って突き進む。リーダーの獅電と、戦士の獣——二人の絆。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ルプスレクス"
          }
        },
        {
          "match": {
            "nameIncludes": "獅電",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_tekkadan",
    "universe": "IBO",
    "no": 3,
    "group": "combo",
    "name": "鉄華団、見参",
    "sub": "少年たちが立ち上げた武装組織、鉄華団。三日月のバルバトス、昭弘のグシオン、シノのフラウロス。火星の砂から這い上がる、鉄の華。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-08"
          }
        },
        {
          "match": {
            "code": "ASW-G-11"
          }
        },
        {
          "match": {
            "code": "ASW-G-64"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_alaya_vijnana",
    "universe": "IBO",
    "no": 4,
    "group": "combo",
    "name": "阿頼耶識の代償",
    "sub": "脊髄に埋め込む人機接続システム、阿頼耶識。バルバトス・グシオン・獅電——その力と引き換えに、少年兵たちは身体を蝕まれていく。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-08"
          }
        },
        {
          "match": {
            "code": "ASW-G-11"
          }
        },
        {
          "match": {
            "nameIncludes": "獅電",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_72_demons",
    "universe": "IBO",
    "no": 5,
    "group": "count",
    "name": "ソロモン72柱の悪魔",
    "sub": "厄祭戦の決戦兵器、ガンダム・フレーム。バルバトス、グシオン、キマリス、バエル……全てソロモンの悪魔の名を冠する。6柱を集め、伝説を呼び覚ませ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "ASW-G"
      },
      "gte": 6
    }
  },
  {
    "id": "ibo_gundam_frames",
    "universe": "IBO",
    "no": 6,
    "group": "combo",
    "name": "ガンダム・フレーム勢揃い",
    "sub": "バルバトス・グシオン・キマリス・バエル・フラウロス・アスタロト。厄祭戦を戦い抜いた72機のうち、選ばれし悪魔たちの競演。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-08"
          }
        },
        {
          "match": {
            "code": "ASW-G-11"
          }
        },
        {
          "match": {
            "code": "ASW-G-26"
          }
        },
        {
          "match": {
            "code": "ASW-G-01"
          }
        },
        {
          "match": {
            "code": "ASW-G-64"
          }
        },
        {
          "match": {
            "code": "ASW-G-29"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_akihiro_gusion",
    "universe": "IBO",
    "no": 7,
    "group": "combo",
    "name": "昭弘の咆哮",
    "sub": "ブルワーズ出身、阿頼耶識の達人アキヒロ・アルトランド。鹵獲したグシオンを、リベイク、リベイクフルシティへと魔改造。重き拳で兄弟の仇を討つ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "グシオン",
            "nameExcludes": [
              "リベイク"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "グシオンリベイク",
            "nameExcludes": "フルシティ"
          }
        },
        {
          "match": {
            "nameIncludes": "フルシティ"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_shino_flauros",
    "universe": "IBO",
    "no": 8,
    "group": "combo",
    "name": "流星号、駆ける",
    "sub": "ノルバ・シノの長距離砲撃機フラウロス、愛称『流星号』。厄祭戦の頃から現代まで、二つの時代を翔ける狙撃の悪魔。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "フラウロス",
            "nameExcludes": "厄祭戦"
          }
        },
        {
          "match": {
            "nameIncludes": "厄祭戦"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_mcgillis_bael",
    "universe": "IBO",
    "no": 9,
    "group": "combo",
    "name": "バエルを掲げよ",
    "sub": "ギャラルホルンの腐敗を覆さんとする男、マクギリス・ファリド。始祖アグニカの遺機バエルと、自らのシュヴァルベグレイズ。革命の狼煙を上げる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-01"
          }
        },
        {
          "match": {
            "nameAll": [
              "シュヴァルベグレイズ"
            ],
            "nameExcludes": "ガエリオ",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_last_lie",
    "universe": "IBO",
    "no": 10,
    "group": "combo",
    "name": "最後の嘘",
    "sub": "バエルさえ掲げれば全てが従う——その幻想に賭けたマクギリスの叛乱。バエルと、ガエリオのヘルムヴィーゲ・リンカー。親友同士の、最後の激突。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-01"
          }
        },
        {
          "match": {
            "nameIncludes": "ヘルムヴィーゲ",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_friends_parted",
    "universe": "IBO",
    "no": 11,
    "group": "combo",
    "name": "袂を分かつ親友",
    "sub": "マクギリスのシュヴァルベグレイズと、ガエリオのキマリス。同じ理想を語り合った二人が、いつしか相容れぬ道を歩む。鉄血屈指の悲劇。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シュヴァルベグレイズ",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "ASW-G-26"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_gaelio_revenge",
    "universe": "IBO",
    "no": 12,
    "group": "combo",
    "name": "ガエリオの復讐",
    "sub": "親友に裏切られ、死の淵から甦った男ガエリオ・ボードウィン。キマリスから、仮面のヴィダール、そしてキマリスヴィダールへ。憎しみが彼を駆る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-26"
          }
        },
        {
          "match": {
            "code": "ASW-G-XX"
          }
        },
        {
          "match": {
            "code": "ASW-G-66"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_vidar_ein",
    "universe": "IBO",
    "no": 13,
    "group": "combo",
    "name": "二つの魂、ヴィダール",
    "sub": "仮面の騎士ヴィダールには、阿頼耶識で繋がれたアインの魂が宿る。ヴィダールとグレイズアイン——憎しみと忠誠が、一つの機体に融け合う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-XX"
          }
        },
        {
          "match": {
            "nameIncludes": "グレイズアイン"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_ein_loyalty",
    "universe": "IBO",
    "no": 14,
    "group": "combo",
    "name": "アインの忠誠",
    "sub": "クランク二尉とガエリオに心酔した青年アイン・ダルトン。彼が辿り着いた、人機一体のグレイズアイン。歪んだ忠義が、悲劇を加速させる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "グレイズアイン"
          }
        },
        {
          "match": {
            "code": "ASW-G-26"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_kimaris_trooper",
    "universe": "IBO",
    "no": 15,
    "group": "combo",
    "name": "誇り高き騎士",
    "sub": "ギャラルホルンの名門ボードウィン家の御曹司、ガエリオ。素体キマリスから、突撃形態キマリストルーパーへ。騎士道を信じた、若き日の彼。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "キマリス",
            "nameExcludes": [
              "トルーパー",
              "ヴィダール"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "キマリストルーパー"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_graze_mass",
    "universe": "IBO",
    "no": 16,
    "group": "combo",
    "name": "ギャラルホルンの量産機",
    "sub": "治安維持組織ギャラルホルンの主力、グレイズ。一般機、改修機、エースのリッター。整った装備と数で、火星の反乱者を押し潰す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "EB-06"
          }
        },
        {
          "match": {
            "codePrefix": "EB-06/tc"
          }
        },
        {
          "match": {
            "codePrefix": "EB-06r"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_graze_corps",
    "universe": "IBO",
    "no": 17,
    "group": "count",
    "name": "グレイズの群れ",
    "sub": "グレイズ系を3機。一般機からシュヴァルベ、リッター、アインまで——ギャラルホルンの量産思想が、棚を埋め尽くす。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "codePrefix": "EB-0"
      },
      "gte": 3
    }
  },
  {
    "id": "ibo_rustal",
    "universe": "IBO",
    "no": 18,
    "group": "combo",
    "name": "アリアンロッドの勝者",
    "sub": "冷徹な戦略家ラスタル・エリオンと、その懐刀ジュリエッタ。レギンレイズジュリアとモビルレギンレイズ。正攻法で鉄華団を追い詰める、勝者の論理。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "レギンレイズジュリア"
          }
        },
        {
          "match": {
            "nameIncludes": "レギンレイズ",
            "nameExcludes": "ジュリア"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_iok",
    "universe": "IBO",
    "no": 19,
    "group": "combo",
    "name": "イオク様の蛮勇",
    "sub": "名門の出ながら空回りし続ける男、イオク・クジャン。レギンレイズとゲイレールを率いて突撃しては事態を悪化させる。視聴者を悶絶させた問題児。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "レギンレイズ",
            "nameExcludes": "ジュリア"
          }
        },
        {
          "match": {
            "code": "EB-04"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_carta",
    "universe": "IBO",
    "no": 20,
    "group": "combo",
    "name": "カルタの騎士団",
    "sub": "ガエリオに想いを寄せる名家の令嬢カルタ・イシュー。彼女のグレイズリッターと、ガエリオのキマリス。儀礼と誇りに殉じた、悲しき騎士。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "codePrefix": "EB-06r"
          }
        },
        {
          "match": {
            "code": "ASW-G-26"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_turbines",
    "universe": "IBO",
    "no": 21,
    "group": "combo",
    "name": "タービンズの女たち",
    "sub": "名瀬・タービンと、彼を支える妻たちの一団タービンズ。百里と百錬、アミダ機。家族のために戦う、テイワズの誇り高き戦士たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "STH-14s"
          }
        },
        {
          "match": {
            "code": "STH-05",
            "nameExcludes": "アミダ"
          }
        },
        {
          "match": {
            "nameIncludes": "アミダ"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_teiwaz",
    "universe": "IBO",
    "no": 22,
    "group": "combo",
    "name": "テイワズの戦力",
    "sub": "鉄華団の後ろ盾となった経済互助組織テイワズ。獅電、百錬、辟邪。火星と宇宙を股にかける、巨大組織の武力。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "獅電",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "STH-05",
            "nameExcludes": "アミダ"
          }
        },
        {
          "match": {
            "code": "STH-20"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_hashmal",
    "universe": "IBO",
    "no": 23,
    "group": "combo",
    "name": "天使を狩る者",
    "sub": "厄祭戦で人類が恐れた自律兵器、モビルアーマー・ハシュマル。眠りから覚めた古の脅威に、バルバトスが立ち向かう。ガンダムの存在理由を問う一戦。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ハシュマル",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "ASW-G-08"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_astaroth",
    "universe": "IBO",
    "no": 24,
    "group": "combo",
    "name": "月鋼のアスタロト",
    "sub": "外伝『月鋼』の主役機、ガンダムアスタロト。素体、オリジン、リナシメントへと姿を変える。本編の影で受け継がれる、もう一柱の悪魔。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "アスタロト",
            "nameExcludes": [
              "オリジン",
              "リナシメント"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "オリジン"
          }
        },
        {
          "match": {
            "nameIncludes": "リナシメント"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_gekko_demons",
    "universe": "IBO",
    "no": 25,
    "group": "combo",
    "name": "月鋼の悪魔たち",
    "sub": "外伝『月鋼』に集う悪魔フレーム。マルコシアス、ウヴァル、ダンタリオン。本編とは別の戦場で、72柱の物語が紡がれる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-35"
          }
        },
        {
          "match": {
            "code": "ASW-G-47"
          }
        },
        {
          "match": {
            "code": "ASW-G-71"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_urdr_hunt",
    "universe": "IBO",
    "no": 26,
    "group": "combo",
    "name": "ウルズハント",
    "sub": "ゲーム発の外伝『ウルズハント』。アスモデウス、ザガン、そして端白星。火星の覇権を賭けた、もう一つのガンダム・フレームの争奪戦。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-32"
          }
        },
        {
          "match": {
            "code": "ASW-G-61"
          }
        },
        {
          "match": {
            "nameIncludes": "端白星",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_brewers",
    "universe": "IBO",
    "no": 27,
    "group": "combo",
    "name": "宇宙鼠の巣",
    "sub": "宇宙海賊ブルワーズが使役した量産機、マンロディとモンキーロディ。子供を兵器として消費する組織——昭弘とその弟が囚われた、暗い過去。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "UGY-R41"
          }
        },
        {
          "match": {
            "nameIncludes": "モンキー",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_human_debris",
    "universe": "IBO",
    "no": 28,
    "group": "combo",
    "name": "ヒューマン・デブリ",
    "sub": "売買され、使い捨てられる子供たち『ヒューマン・デブリ』。鹵獲のグシオンとマンロディが象徴する、鉄血が描いた戦争の最も重い闇。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-11"
          }
        },
        {
          "match": {
            "code": "UGY-R41"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_akihiro_vs_ein",
    "universe": "IBO",
    "no": 29,
    "group": "combo",
    "name": "拳と忠義の激突",
    "sub": "弟を奪われた昭弘のグシオンリベイクと、忠義に狂うアインのグレイズアイン。阿頼耶識の達人同士が、火花を散らす。憎しみのぶつかり合い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "グシオンリベイク"
          }
        },
        {
          "match": {
            "nameIncludes": "グレイズアイン"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_barbatos_vs_bael",
    "universe": "IBO",
    "no": 30,
    "group": "combo",
    "name": "獣と、始祖の機体",
    "sub": "革命を掲げたマクギリスのバエルに、三日月のバルバトスルプスレクスが牙を剥く。理想を語る者と、ただ前へ進む者——その決着。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ルプスレクス"
          }
        },
        {
          "match": {
            "code": "ASW-G-01"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_mika_vs_gaelio",
    "universe": "IBO",
    "no": 31,
    "group": "combo",
    "name": "三日月とガエリオ、決着",
    "sub": "復讐に生きるガエリオのキマリスヴィダールと、三日月のバルバトスルプスレクス。二人の戦士が、それぞれの全てを賭けてぶつかり合う終盤の激闘。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-66"
          }
        },
        {
          "match": {
            "nameIncludes": "ルプスレクス"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_funeral",
    "universe": "IBO",
    "no": 32,
    "group": "combo",
    "name": "葬送",
    "sub": "鉄華団、最後の戦い。バルバトス、グシオン、獅電——少年たちが家族のために散っていく。救いの薄い結末が、深く胸を抉る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ルプスレクス"
          }
        },
        {
          "match": {
            "code": "ASW-G-11"
          }
        },
        {
          "match": {
            "nameIncludes": "獅電",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_shiden_team",
    "universe": "IBO",
    "no": 33,
    "group": "combo",
    "name": "鉄華団の獅電隊",
    "sub": "テイワズから供与された量産機イオフレーム獅電。オルガ機、ライド機、団員機。ガンダムを持たぬ少年たちの、確かな相棒。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "オルガ機",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ライド機",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "獅電",
            "nameExcludes": [
              "オルガ",
              "ライド"
            ],
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "ibo_kimaris_line",
    "universe": "IBO",
    "no": 34,
    "group": "combo",
    "name": "キマリスの系譜",
    "sub": "ガエリオが乗り継いだキマリスの全形態。素体、トルーパー、そして復讐の果てのキマリスヴィダール。騎士の誇りから、憎悪の刃へ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "キマリス",
            "nameExcludes": [
              "トルーパー",
              "ヴィダール"
            ]
          }
        },
        {
          "match": {
            "nameIncludes": "キマリストルーパー"
          }
        },
        {
          "match": {
            "code": "ASW-G-66"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_barbatos_scales",
    "universe": "IBO",
    "no": 35,
    "group": "combo",
    "name": "三日月、二つのスケール",
    "sub": "看板機バルバトスを、MGSDとMG/HGで。同じ獣を異なる縮尺で並べ、鉄華団の象徴を堪能する。可動と密度、それぞれの魅力。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ASW-G-08",
            "grade": "MGSD"
          }
        },
        {
          "match": {
            "code": "ASW-G-08",
            "grade": "MG"
          }
        }
      ]
    }
  },
  {
    "id": "ibo_iron_coating",
    "universe": "IBO",
    "no": 36,
    "group": "combo",
    "name": "鉄血の光沢",
    "sub": "アイアンブラッドコーティングのバルバトスと、通常版。鉄と血の物語を、メタリックな輝きで再構築する。商魂と原作愛の交差点。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "コーティング",
            "series": "鉄血",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "ASW-G-08",
            "nameExcludes": [
              "コーティング",
              "クリア"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "ibo_clear_color",
    "universe": "IBO",
    "no": 37,
    "group": "count",
    "name": "クリアカラー商法",
    "sub": "クリアカラー版の鉄血機を2機。透き通る装甲の下にも、変わらぬ鉄華団の魂が宿る——と信じて、つい手が伸びる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "クリアカラー",
        "series": "鉄血",
        "accessory": true
      },
      "gte": 2
    }
  },
  {
    "id": "ibo_scrap",
    "universe": "IBO",
    "no": 38,
    "group": "count",
    "name": "火星の鉄屑",
    "sub": "鉄血の機体を20機。ガンダム・フレームも量産機も、火星の砂にまみれた鋼の群れ。少年たちが生きた証を、君は集める。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "鉄血",
        "accessory": true
      },
      "gte": 20
    }
  },
  {
    "id": "ibo_master",
    "universe": "IBO",
    "no": 39,
    "group": "count",
    "name": "鉄血の覇者",
    "sub": "鉄血の機体を35機。本編も外伝も、テイワズもギャラルホルンも。Post Disaster の戦史そのものを、君は組み上げた。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "鉄血",
        "accessory": true
      },
      "gte": 35
    }
  },
  {
    "id": "ibo_gjallarhorn_elite",
    "universe": "IBO",
    "no": 40,
    "group": "combo",
    "name": "ギャラルホルンの精鋭",
    "sub": "腐敗の中にも誇りはあった。ガエリオのグリムゲルデ、マクギリスのシュヴァルベ、カルタのグレイズリッター。治安維持組織の、名門の意地。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "V08-1228"
          }
        },
        {
          "match": {
            "nameIncludes": "シュヴァルベグレイズ",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "EB-06r"
          }
        }
      ]
    }
  },
  {
    "id": "as_escape_advance",
    "universe": "AS",
    "no": 1,
    "group": "combo",
    "name": "逃げたら一つ、進めば二つ",
    "sub": "母の言葉を胸に前へ進むスレッタ。臆病だった少女が、エアリアルからキャリバーンへ——一歩踏み出すたび、新しい世界と仲間を掴んでいく。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016"
          }
        },
        {
          "match": {
            "code": "X-EX01"
          }
        }
      ]
    }
  },
  {
    "id": "as_my_bride",
    "universe": "AS",
    "no": 2,
    "group": "combo",
    "name": "私の花嫁",
    "sub": "入学初日の決闘でグエルを破り、図らずもミオリネの婚約者『ホルダー』となったスレッタ。素体、改修型、キャリバーン。すれ違いと和解を経て、二人は本当の伴侶になる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016"
          }
        },
        {
          "match": {
            "code": "XVX-016RN"
          }
        },
        {
          "match": {
            "code": "X-EX01"
          }
        }
      ]
    }
  },
  {
    "id": "as_happy_birthday",
    "universe": "AS",
    "no": 3,
    "group": "combo",
    "name": "ハッピーバースデー",
    "sub": "プロローグ、幼いエリクトの誕生日。父ナディムが歌う『ハッピーバースデー』——その直後、ヴァナディース事変が全てを奪う。後に、処分を待つ強化人士エランもまた、スレッタへ同じ歌を贈った。ルブリス、ファラクト、エアリアル。祝福の歌は、いつも喪失の隣にある。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XGF-02"
          }
        },
        {
          "match": {
            "code": "FP/A-77"
          }
        },
        {
          "match": {
            "code": "XVX-016"
          }
        }
      ]
    }
  },
  {
    "id": "as_gundam_curse",
    "universe": "AS",
    "no": 4,
    "group": "combo",
    "name": "ガンダムの呪い",
    "sub": "性能と引き換えに身体を蝕むデータストーム。エアリアルのパーメットスコア6、キャリバーンのスコア5。GUNDフォーマットを使う者が背負う、命を削る代償。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016",
            "nameIncludes": "パーメットスコア"
          }
        },
        {
          "match": {
            "code": "X-EX01",
            "nameIncludes": "パーメットスコア"
          }
        }
      ]
    }
  },
  {
    "id": "as_quiet_zero",
    "universe": "AS",
    "no": 5,
    "group": "combo",
    "name": "クワイエット・ゼロ",
    "sub": "全人類の意識をパーメットで繋ぐ母プロスペラの計画。改修型エアリアルとキャリバーンで、スレッタはその果てへ挑む。憎しみの連鎖を、自らの手で断ち切るために。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016RN"
          }
        },
        {
          "match": {
            "code": "X-EX01"
          }
        }
      ]
    }
  },
  {
    "id": "as_prospera",
    "universe": "AS",
    "no": 6,
    "group": "combo",
    "name": "プロスペラの復讐",
    "sub": "21年前に全てを奪われた女エルノラ——仮面の下のプロスペラ。彼女が駆ったルブリスと、娘の意思から生んだエアリアル。執念が、静かに物語を動かす。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XGF-02"
          }
        },
        {
          "match": {
            "code": "XVX-016"
          }
        }
      ]
    }
  },
  {
    "id": "as_aerial_is_eri",
    "universe": "AS",
    "no": 7,
    "group": "combo",
    "name": "エアリアルはエリ",
    "sub": "エアリアルに宿る人格——それはスレッタの姉、亡きエリクト。素体と改修型。データストームの海に溶けた少女が、妹を守る『ガンダム』として生き続ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016"
          }
        },
        {
          "match": {
            "code": "XVX-016RN"
          }
        }
      ]
    }
  },
  {
    "id": "as_vanadis",
    "universe": "AS",
    "no": 8,
    "group": "combo",
    "name": "ヴァナディース事変",
    "sub": "GUND-ARM社が魔女狩りの名のもとに殲滅された悲劇の夜。ルブリスと量産試作モデル。全ての始まりにして、プロスペラの復讐の原点となった惨劇。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XGF-02"
          }
        },
        {
          "match": {
            "nameIncludes": "量産試作"
          }
        }
      ]
    }
  },
  {
    "id": "as_guel_growth",
    "universe": "AS",
    "no": 9,
    "group": "combo",
    "name": "グエルの成長譚",
    "sub": "傲慢なホルダーから、地獄を見て成熟する男グエル・ジェターク。ディランザ、ダリルバルデ、シュバルゼッテ。本作で最も深く描かれた、一人の青年の再生。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MD-0032G"
          }
        },
        {
          "match": {
            "code": "MD-0064"
          }
        },
        {
          "match": {
            "code": "MDX-0003"
          }
        }
      ]
    }
  },
  {
    "id": "as_patricide",
    "universe": "AS",
    "no": 10,
    "group": "combo",
    "name": "父を撃つ",
    "sub": "戦場の混乱の中、グエルは敵機を撃つ。コックピットにいたのは——変装した実父ヴィム・ジェターク。グエル機と一般ディランザ。彼の全てを砕いた、最も残酷な一撃。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MD-0032G"
          }
        },
        {
          "match": {
            "code": "MD-0031L"
          }
        }
      ]
    }
  },
  {
    "id": "as_two_summits",
    "universe": "AS",
    "no": 11,
    "group": "combo",
    "name": "二人の到達点",
    "sub": "全てを失い、自らの足で立ち上がったグエルのシュバルゼッテと、スレッタのキャリバーン。それぞれの地獄を越えた二人が、最後に肩を並べる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MDX-0003"
          }
        },
        {
          "match": {
            "code": "X-EX01"
          }
        }
      ]
    }
  },
  {
    "id": "as_elan",
    "universe": "AS",
    "no": 12,
    "group": "combo",
    "name": "強化人士エラン",
    "sub": "番号で管理され、使い捨てられる強化人間『エラン・ケレス』。ファラクトを駆る彼と、心を通わせかけたスレッタ。だが彼は静かに消され、別人と入れ替わる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "FP/A-77"
          }
        },
        {
          "match": {
            "code": "XVX-016"
          }
        }
      ]
    }
  },
  {
    "id": "as_peil",
    "universe": "AS",
    "no": 13,
    "group": "combo",
    "name": "ペイル社の闇",
    "sub": "強化人士を量産し、人を部品として扱う企業ペイル・テクノロジーズ。ファラクトとハインドリー。効率の名のもとに踏み躙られる、命の重み。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "FP/A-77"
          }
        },
        {
          "match": {
            "code": "CFP-010"
          }
        }
      ]
    }
  },
  {
    "id": "as_shaddiq",
    "universe": "AS",
    "no": 14,
    "group": "combo",
    "name": "シャディクの叛逆",
    "sub": "腐敗したベネリットを内側から壊そうとする男シャディク・ゼネリ。ミカエリスとベギルベウ。スレッタの幼馴染が選んだ、理想のための叛逆と破滅。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CFK-029"
          }
        },
        {
          "match": {
            "code": "CEK-040"
          }
        }
      ]
    }
  },
  {
    "id": "as_tomato",
    "universe": "AS",
    "no": 15,
    "group": "combo",
    "name": "収穫の喜び",
    "sub": "プラント・クエタ事変、第1期最終話。ミオリネを守るため、スレッタはエアリアルの腕で敵機をぐしゃりと握り潰す。飛び散る赤は、まるでトマトソース。ミオリネが慈しんで育てるトマトと重なる『収穫』——無邪気な笑顔の地獄落差が、本作の業を象徴する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016"
          }
        },
        {
          "match": {
            "code": "CEK-040"
          }
        }
      ]
    }
  },
  {
    "id": "as_earth_house",
    "universe": "AS",
    "no": 16,
    "group": "combo",
    "name": "地球寮の仲間たち",
    "sub": "差別される地球出身者が身を寄せ合う地球寮。チュチュのデミトレーナー、一般機、デミバーディング。スレッタが初めて得た、本当の居場所と友。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSJ-105CC"
          }
        },
        {
          "match": {
            "code": "MSJ-121"
          }
        },
        {
          "match": {
            "code": "MSJ-R122"
          }
        }
      ]
    }
  },
  {
    "id": "as_chuchu",
    "universe": "AS",
    "no": 17,
    "group": "combo",
    "name": "チュチュの誇り",
    "sub": "地球人への差別に真っ向から怒るチュチュ・パンランチ。彼女のデミと、スレッタのエアリアル。立場の壁を越えて結ばれていく、不器用な友情。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSJ-105CC"
          }
        },
        {
          "match": {
            "code": "XVX-016"
          }
        }
      ]
    }
  },
  {
    "id": "as_nika",
    "universe": "AS",
    "no": 18,
    "group": "combo",
    "name": "ニカの祈り",
    "sub": "地球寮の心優しき整備士ニカ・ナナウラ。差別なき世界を願うあまり、過激派の手引きに加担してしまう。彼女のデミと、繋がってしまったルブリスソーン。善意の代償。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSJ-121"
          }
        },
        {
          "match": {
            "code": "EDM-GA-02"
          }
        }
      ]
    }
  },
  {
    "id": "as_sophie_norea",
    "universe": "AS",
    "no": 19,
    "group": "combo",
    "name": "ソフィーとノレア",
    "sub": "地球の解放を叫ぶ過激派オクス・アースの少女たち、ソフィーとノレア。ルブリスウルとルブリスソーン。歪んだ世界が生んだ、もう一組の哀しき『魔女』。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "EDM-GA-01"
          }
        },
        {
          "match": {
            "code": "EDM-GA-02"
          }
        }
      ]
    }
  },
  {
    "id": "as_norea_nion",
    "universe": "AS",
    "no": 20,
    "group": "combo",
    "name": "地球の解放を",
    "sub": "親友ソフィーを喪い、憎しみに身を委ねるノレア。ルブリスウルから、暴走するガンダムナイオンへ。データストームに呑まれてなお、地球の自由を叫び続ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "EDM-GA-01"
          }
        },
        {
          "match": {
            "nameIncludes": "ナイオン",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "as_benerit",
    "universe": "AS",
    "no": 21,
    "group": "combo",
    "name": "ベネリット・グループ御三家",
    "sub": "巨大企業連合を支える御三家のガンダム。ジェタークのダリルバルデ、グラスレーのミカエリス、ペイルのファラクト。利権と陰謀の、きらびやかな象徴。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MD-0064"
          }
        },
        {
          "match": {
            "code": "CFK-029"
          }
        },
        {
          "match": {
            "code": "FP/A-77"
          }
        }
      ]
    }
  },
  {
    "id": "as_plant_quetta",
    "universe": "AS",
    "no": 22,
    "group": "combo",
    "name": "プラント・クエタ強襲",
    "sub": "オクス・アースがガンダムで仕掛けた無差別テロ。ルブリスソーン、ルブリスウル、迎え撃つエアリアル。学園の平穏が砕け、スレッタが初めて『誰かを殺める』夜。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "EDM-GA-02"
          }
        },
        {
          "match": {
            "code": "EDM-GA-01"
          }
        },
        {
          "match": {
            "code": "XVX-016"
          }
        }
      ]
    }
  },
  {
    "id": "as_duels",
    "universe": "AS",
    "no": 23,
    "group": "combo",
    "name": "祝福の決闘",
    "sub": "アスティカシア学園の頂点ホルダーを賭けた決闘。エアリアル、ダリルバルデ、ミカエリス、ファラクト。祝福の名のもとに、若者たちが己の誇りをぶつけ合う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016"
          }
        },
        {
          "match": {
            "code": "MD-0064"
          }
        },
        {
          "match": {
            "code": "CFK-029"
          }
        },
        {
          "match": {
            "code": "FP/A-77"
          }
        }
      ]
    }
  },
  {
    "id": "as_space_assembly",
    "universe": "AS",
    "no": 24,
    "group": "combo",
    "name": "宇宙議会連合の介入",
    "sub": "地球と宇宙の対立に乗じる宇宙議会連合。ガンヴォルヴァとベギルベウトルシュ。EDM・CEK系の機体が、終盤の混沌をさらに深い泥沼へと引きずり込む。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "EDM-GB"
          }
        },
        {
          "match": {
            "code": "CEK-043"
          }
        }
      ]
    }
  },
  {
    "id": "as_grunts",
    "universe": "AS",
    "no": 25,
    "group": "combo",
    "name": "戦場の量産機",
    "sub": "学園の決闘とは違う、本物の戦場で消耗する量産機たち。ザウォート、ハインドリー、ザウォートヘヴィ。名もなき機体が、企業戦争の現実を映し出す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "F/D-19"
          }
        },
        {
          "match": {
            "code": "CFP-010"
          }
        },
        {
          "match": {
            "code": "F/D-20"
          }
        }
      ]
    }
  },
  {
    "id": "as_gundarm",
    "universe": "AS",
    "no": 26,
    "group": "combo",
    "name": "GUND-ARMの系譜",
    "sub": "義肢技術GUNDから生まれた呪われた兵器、ガンダム。ルブリス、アノクタ、ガンドノード。エアリアルへと至る、知られざる試作機の連なり。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XGF-02"
          }
        },
        {
          "match": {
            "code": "AVP-03"
          }
        },
        {
          "match": {
            "code": "XGF-E3"
          }
        }
      ]
    }
  },
  {
    "id": "as_mgsd",
    "universe": "AS",
    "no": 27,
    "group": "combo",
    "name": "エアリアル、二つのスケール",
    "sub": "新世代の看板機エアリアルを、MGSDとFM/HGで。シールドビットが舞い踊る展開ギミックを、異なる縮尺で心ゆくまで堪能する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "XVX-016",
            "grade": "MGSD"
          }
        },
        {
          "match": {
            "code": "XVX-016",
            "grade": "FM"
          }
        }
      ]
    }
  },
  {
    "id": "as_lauda_rage",
    "universe": "AS",
    "no": 28,
    "group": "combo",
    "name": "ラウダの暴走",
    "sub": "失踪した兄グエルの死をスレッタのせいと思い込み、憎しみに駆られる弟ラウダ。彼のディランザが、エアリアルへ牙を剥く。すれ違いが生んだ、痛ましい同士討ち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MD-0031L"
          }
        },
        {
          "match": {
            "code": "XVX-016"
          }
        }
      ]
    }
  },
  {
    "id": "as_clear",
    "universe": "AS",
    "no": 29,
    "group": "combo",
    "name": "透き通る魔女",
    "sub": "エアリアルのソリッドクリアと、キャリバーンのクリアカラー。透明な装甲の下に、GUNDフォーマットの輝きを透かし見る。商魂と造形美の交差点。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ソリッドクリア"
          }
        },
        {
          "match": {
            "nameIncludes": "クリアカラー",
            "series": "水星"
          }
        }
      ]
    }
  },
  {
    "id": "as_master",
    "universe": "AS",
    "no": 30,
    "group": "count",
    "name": "A.S.の魔女",
    "sub": "水星の魔女の機体を20機。ガンダムの呪いも、企業の陰謀も、地球寮の絆も、スレッタとミオリネの物語も。Ad Stellaの群像劇を、君は丸ごと棚に収めた。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "水星の魔女",
        "accessory": true
      },
      "gte": 20
    }
  },
  {
    "id": "rc_bellri",
    "universe": "RC",
    "no": 1,
    "group": "combo",
    "name": "ベルリのG-セルフ",
    "sub": "キャピタル・ガードの天才候補生ベルリ・ゼナム。大気圏用、アサルト、パーフェクト——状況に応じてパックを換装するG-セルフ。彼の好奇心が、世界を巡る旅へ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "アサルト"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "パーフェクト"
          }
        }
      ]
    }
  },
  {
    "id": "rc_pack_system",
    "universe": "RC",
    "no": 2,
    "group": "combo",
    "name": "パック換装システム",
    "sub": "用途ごとに背部ユニットを載せ替えるG-セルフ。大気圏用、リフレクター、そして宇宙用パック。一機で全領域に対応する、フォトン技術の結晶。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "リフレクター"
          }
        },
        {
          "match": {
            "nameIncludes": "宇宙用パック",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "rc_perfect",
    "universe": "RC",
    "no": 3,
    "group": "combo",
    "name": "パーフェクトパック",
    "sub": "G-セルフの最強形態、パーフェクトパック装備型。全てのパックの機能を統合し、フォトン・トルクの真価を解き放つ。ベルリの到達点。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "パーフェクト"
          }
        },
        {
          "match": {
            "code": "MSAM-033"
          }
        }
      ]
    }
  },
  {
    "id": "rc_aida",
    "universe": "RC",
    "no": 4,
    "group": "combo",
    "name": "アイーダのG-アルケイン",
    "sub": "海賊部隊を率いる女性士官アイーダ・スルガン。ガンダムG-アルケインと、ベルリのG-セルフ。敵味方として出会った二人が、やがて重大な秘密で結ばれる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSAM-033"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        }
      ]
    }
  },
  {
    "id": "rc_klim",
    "universe": "RC",
    "no": 5,
    "group": "combo",
    "name": "クリム・ニックの機体",
    "sub": "アメリア軍のエースにして自信家、クリム・ニック。専用モンテーロと宇宙用ジャハナム。『謎よね』と笑う彼が、戦況を引っ掻き回す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSAM-YM03"
          }
        },
        {
          "match": {
            "code": "MSAM-034a"
          }
        }
      ]
    }
  },
  {
    "id": "rc_amerian",
    "universe": "RC",
    "no": 6,
    "group": "combo",
    "name": "アメリアの戦力",
    "sub": "地球の独立勢力アメリア。G-アルケイン、モンテーロ、量産型ジャハナム。MSAM系の機体が、キャピタルとの戦いに身を投じる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSAM-033"
          }
        },
        {
          "match": {
            "code": "MSAM-YM03"
          }
        },
        {
          "match": {
            "code": "MSAM-034"
          }
        }
      ]
    }
  },
  {
    "id": "rc_mask",
    "universe": "RC",
    "no": 7,
    "group": "combo",
    "name": "仮面の男マスク",
    "sub": "クンタラの出自を隠し、仮面を被って戦う男マスク——その正体はルイン・リー。エルフ・ブルックからマックナイフへ。ベルリへの劣等感が、彼を駆る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CAMS-03",
            "nameIncludes": "マスク"
          }
        },
        {
          "match": {
            "code": "CAMS-05",
            "nameIncludes": "マスク"
          }
        }
      ]
    }
  },
  {
    "id": "rc_kuntala",
    "universe": "RC",
    "no": 8,
    "group": "combo",
    "name": "クンタラの恨み",
    "sub": "差別された階級クンタラの怒りを背負うマスクのマックナイフと、ベルリのG-セルフ。社会の歪みが生んだ因縁が、二人を戦いへと駆り立てる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CAMS-05",
            "nameIncludes": "マスク"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        }
      ]
    }
  },
  {
    "id": "rc_elfbullock",
    "universe": "RC",
    "no": 9,
    "group": "combo",
    "name": "エルフ・ブルックの群れ",
    "sub": "キャピタル・アーミィの量産機エルフ・ブルック。マスク専用機と量産機。フォトン・アーマーを纏った機体が、隊列を組んで押し寄せる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CAMS-03",
            "nameIncludes": "マスク"
          }
        },
        {
          "match": {
            "code": "CAMS-03",
            "nameIncludes": "量産"
          }
        }
      ]
    }
  },
  {
    "id": "rc_mackknife",
    "universe": "RC",
    "no": 10,
    "group": "combo",
    "name": "マックナイフの群れ",
    "sub": "キャピタル・アーミィの高機動機マックナイフ。マスク専用機と量産機。鋭い機動でアメリアを翻弄する、月由来の技術が光る機体。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CAMS-05",
            "nameIncludes": "マスク"
          }
        },
        {
          "match": {
            "code": "CAMS-05",
            "nameIncludes": "量産"
          }
        }
      ]
    }
  },
  {
    "id": "rc_capital",
    "universe": "RC",
    "no": 11,
    "group": "combo",
    "name": "キャピタル・アーミィ",
    "sub": "宗教国家キャピタル・テリトリィの軍。エルフ・ブルック、マックナイフ、カットシー。CAMS系の機体が、フォトンの覇権を握ろうと動く。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "CAMS-03"
          }
        },
        {
          "match": {
            "code": "CAMS-05"
          }
        },
        {
          "match": {
            "code": "CAMS-02"
          }
        }
      ]
    }
  },
  {
    "id": "rc_towasanga",
    "universe": "RC",
    "no": 12,
    "group": "combo",
    "name": "トワサンガの機体",
    "sub": "月の裏側に住まう人々トワサンガ。ジャイオーン、ダハック、ジャスティマ。VGMM系の機体が、地球圏に降下し争乱を広げる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "VGMM-Gb03"
          }
        },
        {
          "match": {
            "code": "VGMM-La01b"
          }
        },
        {
          "match": {
            "code": "VGMM-Sc02"
          }
        }
      ]
    }
  },
  {
    "id": "rc_kabakali",
    "universe": "RC",
    "no": 13,
    "group": "combo",
    "name": "ジット団のカバカーリー",
    "sub": "金星から来た技術者集団ジット団のカバカーリーと、ベルリのG-セルフ。さらなる高みの技術が、レコンギスタ(再征服)の戦いに加わる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "VGMM-Git01"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        }
      ]
    }
  },
  {
    "id": "rc_glucifer",
    "universe": "RC",
    "no": 14,
    "group": "combo",
    "name": "G-ルシファー",
    "sub": "トワサンガが擁するガンダムタイプ、G-ルシファーと、ベルリのG-セルフ。同じ『G』の血を引く機体同士が、月と地球の境界でぶつかり合う。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "VGMM-Gf10"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "パーフェクト"
          }
        }
      ]
    }
  },
  {
    "id": "rc_three_g",
    "universe": "RC",
    "no": 15,
    "group": "combo",
    "name": "三つのGガンダム",
    "sub": "レコンギスタを象徴する『G』の機体。G-セルフ、G-アルケイン、G-ルシファー。失われた技術の結晶たちが、それぞれの陣営で輝く。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        },
        {
          "match": {
            "code": "MSAM-033"
          }
        },
        {
          "match": {
            "code": "VGMM-Gf10"
          }
        }
      ]
    }
  },
  {
    "id": "rc_war",
    "universe": "RC",
    "no": 16,
    "group": "combo",
    "name": "アメリア対キャピタル",
    "sub": "フォトン・バッテリーの覇権を巡る戦争。アメリアのG-アルケインと、キャピタル・アーミィのエルフ・ブルック。エネルギーが、戦の火種となる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSAM-033"
          }
        },
        {
          "match": {
            "code": "CAMS-03"
          }
        }
      ]
    }
  },
  {
    "id": "rc_grimoire",
    "universe": "RC",
    "no": 17,
    "group": "combo",
    "name": "グリモアの脅威",
    "sub": "物語の幕開けを飾る謎の機体グリモアと、迎え撃つG-セルフ。キャピタル・ガードの日常を打ち破った襲撃が、ベルリの運命を動かし始める。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "GH-001"
          }
        },
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "大気圏用"
          }
        }
      ]
    }
  },
  {
    "id": "rc_klim_jahannam",
    "universe": "RC",
    "no": 18,
    "group": "combo",
    "name": "ジャハナムの空",
    "sub": "宇宙用ジャハナムのクリム専用機と量産機。アメリア軍の主力可変機が、宇宙世紀ならぬリギルド・センチュリーの空を駆ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MSAM-034a"
          }
        },
        {
          "match": {
            "code": "MSAM-034"
          }
        }
      ]
    }
  },
  {
    "id": "rc_voyage",
    "universe": "RC",
    "no": 19,
    "group": "combo",
    "name": "レコンギスタの航海",
    "sub": "地球から宇宙、月、そして金星へ。ベルリの旅に連なる機体たち。G-セルフ、モンテーロ、グリモア。世界の真実を求める、果てしない冒険。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "YG-111",
            "nameIncludes": "アサルト"
          }
        },
        {
          "match": {
            "code": "MSAM-YM03"
          }
        },
        {
          "match": {
            "code": "GH-001"
          }
        }
      ]
    }
  },
  {
    "id": "rc_master",
    "universe": "RC",
    "no": 20,
    "group": "count",
    "name": "R.C.の探究者",
    "sub": "Gのレコンギスタの機体を12機。キャピタルもアメリアもトワサンガも。富野作品らしい奔放な群像と機体群を、君は丸ごと棚に収めた。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "レコンギスタ",
        "accessory": true
      },
      "gte": 12
    }
  },
  {
    "id": "cc_white_doll",
    "universe": "CC",
    "no": 1,
    "group": "combo",
    "name": "ホワイトドール",
    "sub": "村が御神体として祀っていた白い像——その正体は∀ガンダムだった。少年ロランが掘り起こした機体と、背に秘めた月光蝶。神話が、兵器として目覚める。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー",
            "nameExcludes": "月光蝶"
          }
        },
        {
          "match": {
            "nameIncludes": "月光蝶",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "cc_two_turns",
    "universe": "CC",
    "no": 2,
    "group": "combo",
    "name": "二つのターンタイプ",
    "sub": "∀ガンダムとターンX。文明を一度リセットするために生まれた、対となる二機。髭の白騎士と、無骨な破壊者。宿命づけられた、最後の戦い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
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
    "id": "cc_moonlight",
    "universe": "CC",
    "no": 3,
    "group": "combo",
    "name": "月光蝶",
    "sub": "あらゆる文明をナノマシンで分解し尽くす究極兵器、月光蝶。ターンXがその翅を広げ、世界を白紙へと還す。黒歴史を生んだ、終末の輝き。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンX"
          }
        },
        {
          "match": {
            "nameIncludes": "月光蝶",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "cc_reset",
    "universe": "CC",
    "no": 4,
    "group": "combo",
    "name": "文明のリセット",
    "sub": "∀とターンX、二つの月光蝶が共鳴する時、歴史は終わる。繭に包まれ眠りにつく二機——人類が幾度も繰り返した過ちを、そっと封印する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー",
            "nameExcludes": "月光蝶"
          }
        },
        {
          "match": {
            "nameIncludes": "ターンX"
          }
        },
        {
          "match": {
            "nameIncludes": "月光蝶",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "cc_harry",
    "universe": "CC",
    "no": 5,
    "group": "combo",
    "name": "ハリー・オードの忠誠",
    "sub": "ディアナ様に一身を捧げる騎士ハリー・オード。黄金のモビルスモーで、時に∀と斬り結ぶ。敵味方を超えて貫かれる、武人の誇り。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "スモー"
          }
        },
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        }
      ]
    }
  },
  {
    "id": "cc_moon_warrior",
    "universe": "CC",
    "no": 6,
    "group": "combo",
    "name": "月の戦士",
    "sub": "月から来た民、ムーンレィスの精鋭機モビルスモーと、ギンガナム艦隊のターンX。地球に降りた月の力が、新たな戦火を呼ぶ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "スモー"
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
    "id": "cc_gold_memory",
    "universe": "CC",
    "no": 7,
    "group": "combo",
    "name": "黄金の記憶",
    "sub": "黄金に輝くモビルスモーと、黒歴史の金獅子・百式。時代を越えて受け継がれる『金色の機体』の系譜——栄光は、世代を超えて甦る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "スモー"
          }
        },
        {
          "match": {
            "nameIncludes": "百式",
            "nameExcludes": [
              "百万",
              "百式壊",
              "ライズ",
              "アンベリール"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "cc_origin",
    "universe": "CC",
    "no": 8,
    "group": "combo",
    "name": "黒歴史・元祖の発掘",
    "sub": "マウンテンサイクルから掘り出された、伝説の白い機体——元祖ガンダムRX-78。∀の遥か過去、最初の戦争の記憶。歴史は、地層となって眠る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "RX-78-2"
          }
        }
      ]
    }
  },
  {
    "id": "cc_borjarnon",
    "universe": "CC",
    "no": 9,
    "group": "combo",
    "name": "ボルジャーノン",
    "sub": "地中から発掘され、現役で運用される量産機——その正体は、太古のザク。∀世界ではボルジャーノンと呼ばれる。黒歴史が、今も戦場を駆ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "MS-06"
          }
        }
      ]
    }
  },
  {
    "id": "cc_mountain_cycle",
    "universe": "CC",
    "no": 10,
    "group": "combo",
    "name": "マウンテンサイクル",
    "sub": "過去の兵器が眠る埋蔵遺跡、マウンテンサイクル。∀と共に掘り起こされる元祖ガンダム、ザク、ダブルゼータ。地層に刻まれた、戦争の年輪。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "RX-78-2"
          }
        },
        {
          "match": {
            "codePrefix": "MS-06"
          }
        },
        {
          "match": {
            "codePrefix": "MSZ-010"
          }
        }
      ]
    }
  },
  {
    "id": "cc_psycommu",
    "universe": "CC",
    "no": 11,
    "group": "combo",
    "name": "サイコミュの亡霊",
    "sub": "ターンXと、黒歴史のサイコミュ兵器ジオング。念じて操る古の技術が、Correct Centuryの空に甦る。人の業は、いつの時代も変わらない。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンX"
          }
        },
        {
          "match": {
            "codePrefix": "MSN-02"
          }
        }
      ]
    }
  },
  {
    "id": "cc_zeta",
    "universe": "CC",
    "no": 12,
    "group": "combo",
    "name": "黒歴史・Zの記憶",
    "sub": "∀と、可変機Zガンダム。グリプス戦役という名の遠い過去が、地層の底から顔を覗かせる。誰も覚えていない、激しい戦いの残響。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "MSZ-006"
          }
        }
      ]
    }
  },
  {
    "id": "cc_zz",
    "universe": "CC",
    "no": 13,
    "group": "combo",
    "name": "黒歴史・ダブルゼータ",
    "sub": "∀と、ハイメガキャノンの巨人ZZガンダム。派手な火力を誇った過去の英雄機も、Correct Centuryでは発掘品の一つに過ぎない。栄光の風化。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "MSZ-010"
          }
        }
      ]
    }
  },
  {
    "id": "cc_mk2",
    "universe": "CC",
    "no": 14,
    "group": "combo",
    "name": "黒歴史・Mk-IIの影",
    "sub": "∀と、ティターンズの試作機ガンダムMk-II。連邦内戦の象徴も、月光蝶の前には等しく『黒歴史』。記録から消された、無数の物語の一片。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "RX-178"
          }
        }
      ]
    }
  },
  {
    "id": "cc_cca",
    "universe": "CC",
    "no": 15,
    "group": "combo",
    "name": "逆襲の残響",
    "sub": "∀と共に甦る、νガンダムとサザビー。アクシズを巡る赤い彗星と白いニュータイプの決闘——その因縁すら、黒歴史の地層に埋もれている。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "RX-93",
            "nameExcludes": [
              "Hi",
              "ν2"
            ]
          }
        },
        {
          "match": {
            "codePrefix": "MSN-04"
          }
        }
      ]
    }
  },
  {
    "id": "cc_ginganum",
    "universe": "CC",
    "no": 16,
    "group": "combo",
    "name": "ギンガナムの渇望",
    "sub": "戦いこそ生きる意味と信じる男ギム・ギンガナム。ターンXを駆り、黒歴史の核兵器GP02まで掘り起こす。破壊への純粋な飢えが、世界を脅かす。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンX"
          }
        },
        {
          "match": {
            "code": "RX-78GP02A"
          }
        }
      ]
    }
  },
  {
    "id": "cc_unearth_war",
    "universe": "CC",
    "no": 17,
    "group": "combo",
    "name": "戦いを掘り起こす者",
    "sub": "眠れる過去の兵器を次々と起こすギンガナム。ターンXと、発掘されたザクの群れ。終わった戦争を、わざわざ蘇らせる愚——それもまた、人の性。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンX"
          }
        },
        {
          "match": {
            "codePrefix": "MS-06"
          }
        }
      ]
    }
  },
  {
    "id": "cc_amphibious",
    "universe": "CC",
    "no": 18,
    "group": "combo",
    "name": "水底からの帰還",
    "sub": "∀と、海から引き揚げられた水陸両用機ズゴックやゴッグ。深海に沈んでいた一年戦争の遺物が、再び陽の光を浴びる。錆びた鋼の、第二の生。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "codePrefix": "MSM"
          }
        }
      ]
    }
  },
  {
    "id": "cc_gold_giant",
    "universe": "CC",
    "no": 19,
    "group": "combo",
    "name": "黄金の巨人",
    "sub": "∀と、黒歴史の金獅子・百式。『変わらぬ強さの象徴』として、金色の機体は時代を越えて立ち続ける。クワトロの遺産、Correct Centuryに在り。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエー"
          }
        },
        {
          "match": {
            "nameIncludes": "百式",
            "nameExcludes": [
              "百万",
              "百式壊",
              "ライズ",
              "アンベリール"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "cc_master",
    "universe": "CC",
    "no": 20,
    "group": "count",
    "name": "正暦の語り部",
    "sub": "∀ガンダムの立体物を4機。∀・ターンX・スモー・月光蝶。数は少なくとも、黒歴史の全てを内包する、最も巨大な物語の担い手。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "∀ガンダム",
        "accessory": true
      },
      "gte": 4
    }
  },
  {
    "id": "gqx_char_steals",
    "universe": "GQX",
    "no": 1,
    "group": "combo",
    "name": "赤い彗星、ガンダムを駆る",
    "sub": "サイド7。本来連邦に渡るはずだった試作機を、赤い彗星シャア・アズナブルが奪い去る。乗り慣れたザクを捨て、赤いガンダムへ——たった一つの『if』が、一年戦争の全てを書き換える。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "code": "MS-06S",
            "series": "ジークアクス"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_show_me",
    "universe": "GQX",
    "no": 2,
    "group": "combo",
    "name": "見せてもらおうか",
    "sub": "「見せてもらおうか、ガンダムの性能とやらを」——正史では連邦機へ向けられた台詞が、ここでは反転する。赤いガンダムと白いガンダム。撃つ者と撃たれる者が、入れ替わった世界。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "code": "RX-78-02",
            "series": "ジークアクス"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_vs_canon",
    "universe": "GQX",
    "no": 3,
    "group": "combo",
    "name": "正史への問いかけ",
    "sub": "赤いガンダムと、正史の白いガンダムRX-78-2。もしもアムロではなくシャアがガンダムに乗っていたら——並べて初めて見えてくる、『あったかもしれない歴史』との対話。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "codePrefix": "RX-78-2"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_if_war",
    "universe": "GQX",
    "no": 4,
    "group": "combo",
    "name": "もしもの一年戦争",
    "sub": "赤いガンダムと、正史のシャアザク、量産ザク。エースが連邦の象徴を駆る世界では、ジオンが優勢のまま戦争が進む。歴史の歯車が、静かに軋みを上げる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "code": "MS-06S",
            "nameExcludes": "(GQ)"
          }
        },
        {
          "match": {
            "code": "MS-06",
            "nameExcludes": [
              "(GQ)",
              "軍警"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "gqx_proto",
    "universe": "GQX",
    "no": 5,
    "group": "combo",
    "name": "ガンダム開発系譜",
    "sub": "試作機01ガンダムと、白いガンダム(RX-78-02)。V作戦の知られざる試作の連なりが、この世界でも確かに刻まれている。正史と地続きの、開発の足跡。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "RX-78-01",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "code": "RX-78-02",
            "series": "ジークアクス"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_red_expand",
    "universe": "GQX",
    "no": 6,
    "group": "combo",
    "name": "拡張された赤",
    "sub": "赤いガンダムと、その拡張セット。奪われた試作機が、新たな武装で『if』の戦場に最適化されていく。正史にはない、もう一つの進化形。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "nameIncludes": "赤いガンダム用",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "gqx_machu",
    "universe": "GQX",
    "no": 7,
    "group": "combo",
    "name": "マチュのジークアクス",
    "sub": "平凡な少女アマテ・ユズリハ——『マチュ』が出会う、謎のモビルスーツGQuuuuuuX。素体と、エンディミオン・ユニット覚醒形態。日常が、地下の戦いへと反転する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "GQuuuuuuX",
            "nameExcludes": "エンディミオン",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "エンディミオン",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "gqx_endymion",
    "universe": "GQX",
    "no": 8,
    "group": "combo",
    "name": "エンディミオン・ユニット覚醒",
    "sub": "GQuuuuuuXに秘められた力、エンディミオン・ユニットの覚醒。赤いガンダムと対峙し、マチュの中の何かが目覚める。少女が『パイロット』になる、決定的な瞬間。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "エンディミオン",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "gMS-α"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_machu_shuji",
    "universe": "GQX",
    "no": 9,
    "group": "combo",
    "name": "マチュとシュウジ",
    "sub": "GQuuuuuuXのマチュと、赤いガンダムの謎の少年シュウジ。敵か味方か——惹かれ合いながらも、二人は世界の秘密の中心へと引き寄せられていく。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "GQuuuuuuX",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "gMS-α"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_nyaan",
    "universe": "GQX",
    "no": 10,
    "group": "combo",
    "name": "ニャアンと難民の街",
    "sub": "マチュの相棒、難民の少女ニャアン。ジオン統治下のコロニーで、軍警ザクが睨みを利かせる薄暗い街。持たざる者たちの視点が、この物語に影を落とす。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "GQuuuuuuX",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "MS-06-SSP"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_clan_battle",
    "universe": "GQX",
    "no": 11,
    "group": "combo",
    "name": "クランバトル",
    "sub": "コロニーの地下で繰り広げられる非合法モビルスーツ闘技、クランバトル。スガイ機、ボカタ機のゲルググ。賞金と意地を賭けた、熱狂と退廃の祭り。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-01",
            "nameIncludes": "スガイ"
          }
        },
        {
          "match": {
            "code": "gMS-01",
            "nameIncludes": "ボカタ"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_two_red_zaku",
    "universe": "GQX",
    "no": 12,
    "group": "combo",
    "name": "もう一つの赤いザク",
    "sub": "この世界のシャア専用ザクと、正史のシャアザク。同じ赤、同じ三倍——だが歩む先は違う。並べた瞬間、二つの歴史の分岐がくっきりと浮かび上がる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-06S",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "code": "MS-06S",
            "nameExcludes": "(GQ)"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_boy",
    "universe": "GQX",
    "no": 13,
    "group": "combo",
    "name": "坊やだからさ",
    "sub": "「なぜ殴った!」「殴られて、当たり前だ」——シャアの冷徹は、この世界でも変わらない。シャア専用ザクと量産ザク。エースと兵卒を隔てる、才能と非情の距離。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-06S",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "code": "MS-06",
            "series": "ジークアクス"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_char_machines",
    "universe": "GQX",
    "no": 14,
    "group": "combo",
    "name": "シャアという男",
    "sub": "if世界のシャアザクと、正史で彼が乗り継いだゲルググ、ジオング。どの歴史でも、この男は赤き栄光と破滅へ突き進む。シャア・アズナブルという、変わらぬ業。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-06S",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "code": "MS-14S"
          }
        },
        {
          "match": {
            "code": "MSN-02"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_seira",
    "universe": "GQX",
    "no": 15,
    "group": "combo",
    "name": "セイラの軽キャノン",
    "sub": "正史では戦いを厭うた女性セイラ(セイラ・マス)が、この世界では軽キャノンを駆る。専用機と一般機。穏やかな彼女がトリガーを引く——『if』が見せる、もう一つの貌。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "セイラ"
          }
        },
        {
          "match": {
            "code": "RGM-79",
            "series": "ジークアクス",
            "nameExcludes": "セイラ"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_mass_siblings",
    "universe": "GQX",
    "no": 16,
    "group": "combo",
    "name": "マス家の兄妹",
    "sub": "セイラの軽キャノンと、赤いガンダム。キャスバルとアルテイシア——数奇な運命に引き裂かれた兄と妹が、この世界では再び戦場で交差する。血の絆と、すれ違い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "セイラ"
          }
        },
        {
          "match": {
            "code": "gMS-α"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_tristars",
    "universe": "GQX",
    "no": 17,
    "group": "combo",
    "name": "黒い三連星",
    "sub": "ガイア、オルテガ、そして正史から駆けつけるもう一機のリック・ドム。three が織りなすジェットストリームアタックは、世界が変わっても健在。連携の美学。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-09",
            "series": "ジークアクス",
            "nameIncludes": "ガイア"
          }
        },
        {
          "match": {
            "codePrefix": "MS-09",
            "nameExcludes": "(GQ)"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_shalia",
    "universe": "GQX",
    "no": 18,
    "group": "combo",
    "name": "シャリア・ブルの邂逅",
    "sub": "正史では戦死した木星帰りのニュータイプ、シャリア・ブル。この世界では専用リック・ドムを駆り、マチュのGQuuuuuuXと感応し合う。死なずに生きた男が見る、新しい光。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-09",
            "series": "ジークアクス",
            "nameIncludes": "シャリア"
          }
        },
        {
          "match": {
            "nameIncludes": "GQuuuuuuX",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "gqx_newtype",
    "universe": "GQX",
    "no": 19,
    "group": "combo",
    "name": "ニュータイプの覚醒",
    "sub": "エンディミオン覚醒のGQuuuuuuXと、シャリアのリック・ドム。革新者たちが空間を超えて呼び交わす。戦争の時代に、人はどこまで分かり合えるのか——永遠の問い。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "エンディミオン",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "MS-09",
            "series": "ジークアクス",
            "nameIncludes": "シャリア"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_exabe_gyan",
    "universe": "GQX",
    "no": 20,
    "group": "combo",
    "name": "エグザベのギャン",
    "sub": "正史ではマ・クベの一点物だったギャンが、この世界ではエグザベの愛機としてクランバトルを駆ける。ハクジ装備の白兵戦機と、ゲルググ。日陰の名機に当たる、もう一度の光。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-15/H"
          }
        },
        {
          "match": {
            "code": "gMS-01",
            "nameExcludes": [
              "スガイ",
              "ボカタ"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "gqx_hambrabi",
    "universe": "GQX",
    "no": 21,
    "group": "combo",
    "name": "ハンブラビの謎",
    "sub": "本来ならグリプス戦役の機体ハンブラビが、なぜここに——時代を超えて現れる異物が、この世界の歴史の歪みを暗示する。GQuuuuuuXと対峙する、不吉な三つ目。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "ORX-139"
          }
        },
        {
          "match": {
            "nameIncludes": "GQuuuuuuX",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "gqx_gfred",
    "universe": "GQX",
    "no": 22,
    "group": "combo",
    "name": "GFreDの戦い",
    "sub": "クランバトルに姿を見せる独自機GFreDと、ゲルググ・スガイ機。正史には存在しない機体たちが、地下闘技場の熱気の中でぶつかり合う。if世界ならではの顔ぶれ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-κ"
          }
        },
        {
          "match": {
            "code": "gMS-01",
            "nameIncludes": "スガイ"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_zaku_horde",
    "universe": "GQX",
    "no": 23,
    "group": "combo",
    "name": "ザクの群れ",
    "sub": "ジオンが優勢なこの世界、コロニーはザクで溢れる。一般機、軍警ザク、そしてシャア専用ザク。緑と赤の量産機が、勝者の論理を体現する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-06",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "code": "MS-06-SSP"
          }
        },
        {
          "match": {
            "code": "MS-06S",
            "series": "ジークアクス"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_v_operation",
    "universe": "GQX",
    "no": 24,
    "group": "combo",
    "name": "連邦の白いやつ",
    "sub": "白いガンダムと、正史のガンキャノン、ガンタンク。奪われなかった『もう一つの』V作戦の機体たち。正史機を傍らに置けば、失われた歴史の輪郭が見えてくる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "RX-78-02",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "codePrefix": "RX-77"
          }
        },
        {
          "match": {
            "codePrefix": "RX-75"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_three_times",
    "universe": "GQX",
    "no": 25,
    "group": "combo",
    "name": "通常の三倍",
    "sub": "赤いガンダムと、正史のシャア専用ゲルググ。『通常の三倍』の速度で駆ける赤——機体が変わっても、赤い彗星の伝説だけは色褪せない。シャアの代名詞、二つの時代に。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "code": "MS-14S"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_zeong_ghost",
    "universe": "GQX",
    "no": 26,
    "group": "combo",
    "name": "ジオングの亡霊",
    "sub": "GQuuuuuuXと、正史でシャアが最後に乗ったジオング。サイコミュとニュータイプ——正史で辿り着いた未完の到達点が、if世界のマチュの機体に影を重ねる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "GQuuuuuuX",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "MSN-02"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_rick_dom",
    "universe": "GQX",
    "no": 27,
    "group": "combo",
    "name": "リック・ドム隊",
    "sub": "ガイア/オルテガ機と、シャリア専用機。この世界のリック・ドムたちが、宇宙の闇を黒く塗りつぶす。正史のエースたちが、別の運命で再集結する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-09",
            "series": "ジークアクス",
            "nameIncludes": "ガイア"
          }
        },
        {
          "match": {
            "code": "MS-09",
            "series": "ジークアクス",
            "nameIncludes": "シャリア"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_two_worlds",
    "universe": "GQX",
    "no": 28,
    "group": "combo",
    "name": "二つのガンダム、二つの世界",
    "sub": "赤いガンダム、白いガンダム、01ガンダム。奪われた者と、奪われなかった者と、その原型。三機を並べれば、この『if』が正史とどこで枝分かれしたのかが見えてくる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "gMS-α"
          }
        },
        {
          "match": {
            "code": "RX-78-02",
            "series": "ジークアクス"
          }
        },
        {
          "match": {
            "code": "RX-78-01",
            "series": "ジークアクス"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_aces",
    "universe": "GQX",
    "no": 29,
    "group": "combo",
    "name": "if線のエースたち",
    "sub": "エグザベのギャン、シャリアのリック・ドム、スガイのゲルググ。正史の脇役や戦死者が、この世界では主役級の見せ場を得る。『もしも』が照らす、もう一つの群像。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "code": "MS-15/H"
          }
        },
        {
          "match": {
            "code": "MS-09",
            "series": "ジークアクス",
            "nameIncludes": "シャリア"
          }
        },
        {
          "match": {
            "code": "gMS-01",
            "nameIncludes": "スガイ"
          }
        }
      ]
    }
  },
  {
    "id": "gqx_master",
    "universe": "GQX",
    "no": 30,
    "group": "count",
    "name": "ジークアクスの世界",
    "sub": "GQuuuuuuXの機体を12機。シャアが奪ったガンダムも、マチュのジークアクスも、正史から迷い込んだエースたちも。『if』が描く一年戦争を、君は丸ごと棚に収めた。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ジークアクス",
        "accessory": true
      },
      "gte": 12
    }
  },
  {
    "id": "bf_buildstrike",
    "universe": "BF",
    "no": 1,
    "group": "combo",
    "name": "ガンプラは自由だ",
    "sub": "イオリ・セイが組み、レイジが駆るビルドストライク。下敷きは C.E. のストライク。換装で姿を変える原典を、少年の自由な発想がさらに塗り替える。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ビルドストライク",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "GAT-X105"
          }
        }
      ]
    }
  },
  {
    "id": "bf_fenice",
    "universe": "BF",
    "no": 2,
    "group": "combo",
    "name": "情熱のイタリア、ウイング",
    "sub": "リカルド・フェリーニの相棒ウイングガンダムフェニーチェ。A.C. のウイングを、ラテンの情熱と海賊の意匠で大胆にアレンジした一機。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "フェニーチェ",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "XXXG-01W"
          }
        }
      ]
    }
  },
  {
    "id": "bf_darkmatter",
    "universe": "BF",
    "no": 3,
    "group": "combo",
    "name": "名人が染めた漆黒",
    "sub": "メイジン・カワグチのエクシアダークマター。00 のエクシアを下敷きに、闇色のGN粒子『ダークマター』で覆った、王者の機体。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダークマター",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "GN-001"
          }
        }
      ]
    }
  },
  {
    "id": "bf_beargguy",
    "universe": "BF",
    "no": 4,
    "group": "combo",
    "name": "可愛さもまた、武器なり",
    "sub": "コウサカ・チナのベアッガイ。U.C. のアッガイを愛らしい熊へ仕立てた、ビルドシリーズ屈指の癒やし枠。原典の丸さが、ここで花開く。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ベアッガイ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "アッガイ",
            "nameExcludes": "ベアッガイ"
          }
        }
      ]
    }
  },
  {
    "id": "bf_zaku_amazing",
    "universe": "BF",
    "no": 5,
    "group": "combo",
    "name": "ザクの怪物",
    "sub": "ザクアメイジング。U.C. の量産機ザクを、名人が魔改造した変則機。緑の機体が、ガンプラバトルの常識を覆す。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ザクアメイジング",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "MS-06"
          }
        }
      ]
    }
  },
  {
    "id": "bf_shinobi",
    "universe": "BF",
    "no": 6,
    "group": "combo",
    "name": "忍法、変身の術",
    "sub": "忍パルスガンダム。C.E. のインパルスを和風の忍者に仕立てた怪作。コアスプレンダーの合体ギミックを、忍術に見立てる遊び心。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "忍パルス",
            "accessory": true
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
    "id": "bf_x_maou",
    "universe": "BF",
    "no": 7,
    "group": "combo",
    "name": "魔王、降臨",
    "sub": "ガンダムX魔王。A.W. のガンダムXを下敷きにした、ユウキ・タツヤの『魔王』シリーズ。サテライトキャノンならぬ、邪悪な威容。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "X魔王",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "GX-9900"
          }
        }
      ]
    }
  },
  {
    "id": "bf_megashiki",
    "universe": "BF",
    "no": 8,
    "group": "combo",
    "name": "百式、百万の輝き",
    "sub": "百万式(メガシキ)。U.C. の百式を、文字通り百万倍に盛った金ピカの巨砲機。原典の『金色』への、過剰なまでのオマージュ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "百万式",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "百式",
            "nameExcludes": [
              "百万",
              "百式壊",
              "ライズ"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "bf_lightning_z",
    "universe": "BF",
    "no": 9,
    "group": "combo",
    "name": "可変、雷光のZ",
    "sub": "ライトニングZガンダム。U.C. のZガンダムを、ユウマ・コウサカのライトニングと融合させた可変機。ウェーブライダー変形は健在。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ライトニングZ",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "MSZ-006",
            "nameExcludes": "ライトニング"
          }
        }
      ]
    }
  },
  {
    "id": "bf_crossbone_maou",
    "universe": "BF",
    "no": 10,
    "group": "combo",
    "name": "髑髏の魔王",
    "sub": "クロスボーンガンダム魔王。U.C. 木星帝国のクロスボーンを下敷きにした『魔王』機。アンカーとビームザンバー、海賊の魂はそのまま。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "クロスボーンガンダム魔王",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "クロスボーン",
            "nameExcludes": [
              "魔王",
              "TYPE.GBFT"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "bf_kempfer_amazing",
    "universe": "BF",
    "no": 11,
    "group": "combo",
    "name": "強襲の魔改造",
    "sub": "ケンプファーアメイジング。U.C. の強襲機ケンプファーを名人が再構築。使い捨ての武装てんこ盛りという原典の思想を、極限まで増幅する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ケンプファーアメイジング",
            "accessory": true
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
    "id": "bf_miss_sazabi",
    "universe": "BF",
    "no": 12,
    "group": "combo",
    "name": "紅は、女性の色",
    "sub": "ミスサザビー。U.C. のシャア専用サザビーを、しなやかな女性体に仕立てた異色機。赤い巨体の威圧を、優美なシルエットへ転生させる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ミスサザビー",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "MSN-04"
          }
        }
      ]
    }
  },
  {
    "id": "bf_gouf_r35",
    "universe": "BF",
    "no": 13,
    "group": "combo",
    "name": "蒼き巨星、R35",
    "sub": "グフR35。U.C. のランバ・ラルの愛機グフを、レーサー風に磨き上げたカスタム。ヒートロッドの誇りは、世代を超えて受け継がれる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "グフR35",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "MS-07",
            "nameExcludes": "R35"
          }
        }
      ]
    }
  },
  {
    "id": "bf_dom_r35",
    "universe": "BF",
    "no": 14,
    "group": "combo",
    "name": "黒い三連星、再び",
    "sub": "ドムR35。U.C. の重MSドムを、流麗なレーサーへと仕立て直す。ジェットストリームアタックの記憶を、新たな塗装に宿して。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ドムR35",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "MS-09",
            "nameExcludes": "R35"
          }
        }
      ]
    }
  },
  {
    "id": "bf_hinu_brave",
    "universe": "BF",
    "no": 15,
    "group": "combo",
    "name": "勇気のフィン・ファンネル",
    "sub": "Hi-νガンダムヴレイブ。U.C. のHi-νを下敷きに、勇者の意匠を加えた一機。アムロの遺した名機が、ガンプラバトルで再び翔ぶ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ヴレイブ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "Hi-ν",
            "nameExcludes": [
              "ヴレイブ",
              "インフラックス"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "bf_weiss_sinanju",
    "universe": "BF",
    "no": 16,
    "group": "combo",
    "name": "白きシナンジュ",
    "sub": "ヴァイスシナンジュ。U.C. のフロンタル機シナンジュを、純白に塗り替えた変則機。赤い彗星の意匠が、白の中で別の生を得る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ヴァイスシナンジュ",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "MSN-06S"
          }
        }
      ]
    }
  },
  {
    "id": "bf_turn_a_shin",
    "universe": "BF",
    "no": 17,
    "group": "combo",
    "name": "ヒゲの新生",
    "sub": "ターンエーガンダムシン。賛否を呼んだ∀の髭デザインを、シャープに再解釈した一機。原典への愛と挑戦が同居する、玄人向けの逸品。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ターンエーガンダムシン",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ターンエー",
            "nameExcludes": "シン"
          }
        }
      ]
    }
  },
  {
    "id": "bf_amazing_sf",
    "universe": "BF",
    "no": 18,
    "group": "combo",
    "name": "名人の自由",
    "sub": "アメイジングストライクフリーダム。C.E. のストライクフリーダムを名人が極めた機体。ドラグーンの全弾発射という原典の華を、さらに増幅する。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "アメイジングストライクフリーダム",
            "accessory": true
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
    "id": "bf_jiaen_altron",
    "universe": "BF",
    "no": 19,
    "group": "combo",
    "name": "双頭龍の継承",
    "sub": "ガンダムジーエンアルトロン。A.C. のアルトロンを下敷きに、二匹の龍頭を備えたダイバーズ機。ナタクの牙が、電脳世界で甦る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ジーエンアルトロン",
            "accessory": true
          }
        },
        {
          "match": {
            "code": "XXXG-01S2",
            "nameExcludes": "ジーエン"
          }
        }
      ]
    }
  },
  {
    "id": "bf_nu_zeon",
    "universe": "BF",
    "no": 20,
    "group": "combo",
    "name": "νにジオンを",
    "sub": "ν-ジオンガンダム。U.C. の到達点νガンダムに、あえてジオンの意匠を混ぜ込む禁断の融合。連邦と公国、二つの美学が一機に宿る。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ジオンガンダム",
            "accessory": true
          }
        },
        {
          "match": {
            "codePrefix": "RX-93",
            "nameExcludes": [
              "Hi",
              "ν2"
            ]
          }
        }
      ]
    }
  },
  {
    "id": "bf_sei_reiji",
    "universe": "BF",
    "no": 21,
    "group": "combo",
    "name": "セイとレイジの原点",
    "sub": "ビルダー・セイとファイター・レイジ、二人三脚の相棒機。ビルドストライクから、プラフスキーウイングを得たスタービルドストライクへ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ビルドストライクガンダム",
            "nameExcludes": [
              "スター",
              "ギャラクシー"
            ],
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "スタービルドストライク",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_meijin_amazing",
    "universe": "BF",
    "no": 22,
    "group": "combo",
    "name": "名人カワグチの流儀",
    "sub": "メイジン・カワグチが駆る『アメイジング』の系譜。エクシアダークマター、アメイジングエクシア、アメイジングレッドウォーリア。王者の魔改造。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダークマター",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "アメイジングエクシア",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "アメイジングレッドウォーリア",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_burning_lineage",
    "universe": "BF",
    "no": 23,
    "group": "combo",
    "name": "燃える、ゴッドの系譜",
    "sub": "Gガンダムへの愛が結晶した『バーニング』の血脈。ビルド・トライ・カミキ・神——爆熱ゴッドフィンガーの魂が、世代を越えて燃え続ける。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ビルドバーニング",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "トライバーニング",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "カミキバーニング",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "神バーニング",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_try_team",
    "universe": "BF",
    "no": 24,
    "group": "combo",
    "name": "トライ部隊、参上",
    "sub": "セカイのトライバーニング、フミナのういにんぐ、ユウマのライトニング。中学生三人組が世界の頂を目指す、ビルドファイターズトライの主役機。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "トライバーニング",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ういにんぐふみな",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ライトニングガンダム",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_beargguy_family",
    "universe": "BF",
    "no": 25,
    "group": "combo",
    "name": "ベアッガイ一家",
    "sub": "III、F、P——増え続ける熊の大家族。コウサカ家の愛と、ガンプラの可愛さが詰まった、シリーズ名物のほのぼの枠。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ベアッガイIII",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ベアッガイF",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ベアッガイP",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_fumina",
    "universe": "BF",
    "no": 26,
    "group": "count",
    "name": "ふみな姉さんの人気",
    "sub": "すーぱーふみな、ういにんぐふみな、こまんどふみな……気づけば増殖する『ふみな』たち。美少女プラモ枠の、揺るぎなき主力。3体で殿堂入り。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "ふみな",
        "accessory": true
      },
      "gte": 3
    }
  },
  {
    "id": "bf_trion3",
    "universe": "BF",
    "no": 27,
    "group": "combo",
    "name": "合体せよ、トライオン3",
    "sub": "ガンダムトライオン3とドライオンIII。三機が合体する巨大ロボという、70年代スーパーロボットへの全力オマージュ。ガンダムの枠を、軽々と超える。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "トライオン3",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ドライオン",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_lightning_line",
    "universe": "BF",
    "no": 28,
    "group": "combo",
    "name": "ユウマの雷光",
    "sub": "ライトニングガンダム、ライトニングZ、スターバーニング。バックウェポンシステムを乗り換えながら戦う、ユウマ・コウサカの系譜。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ライトニングガンダム",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ライトニングZ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "スターバーニング",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_maou_series",
    "universe": "BF",
    "no": 29,
    "group": "combo",
    "name": "魔王シリーズ",
    "sub": "ガンダムX魔王、クロスボーン魔王、そしてX十魔王。原典を闇に落とすユウキ・タツヤの『魔王』コレクション。邪悪こそ、最高の遊び。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "X魔王",
            "nameExcludes": "十魔王",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "クロスボーンガンダム魔王",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "十魔王",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_riku_00",
    "universe": "BF",
    "no": 30,
    "group": "combo",
    "name": "リクのダブルオー",
    "sub": "ガンダムダブルオーダイバー、ダブルオースカイ、スカイメビウス。00 への愛を全身に纏った、ビルドダイバーズ主役機の進化。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダブルオーダイバー",
            "nameExcludes": [
              "エース",
              "アーク"
            ],
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ダブルオースカイ",
            "nameExcludes": "メビウス",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "スカイメビウス",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_hiroto_core",
    "universe": "BF",
    "no": 31,
    "group": "combo",
    "name": "コアガンダムの換装",
    "sub": "ヒロトのコアガンダムが、アースリィ、アルスアースリィへと姿を変える。小さな核に外装を着せ替える、Re:RISE のビルド思想の到達点。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "アースリィガンダム",
            "nameExcludes": "アルス",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "アルスアースリィ",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_divers_force",
    "universe": "BF",
    "no": 32,
    "group": "combo",
    "name": "ビルドダイバーズの仲間",
    "sub": "フォース『ビルドダイバーズ』の面々。00スカイ、AGE-IIマグナム、ガルバルディリベイク、ジャスティスナイト。電脳世界で結ばれた絆。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダブルオースカイ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "マグナム",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ガルバルディリベイク",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ジャスティスナイト",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_00_love",
    "universe": "BF",
    "no": 33,
    "group": "combo",
    "name": "ダブルオーへの愛",
    "sub": "00ダイバー、セラヴィーシェヘラザード、ダブルオーコマンドクアンタ。トランザムとGN粒子への、止まらぬオマージュの数々。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ダブルオーダイバー",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "シェヘラザード",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "コマンドクアンタ",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_metaverse",
    "universe": "BF",
    "no": 34,
    "group": "combo",
    "name": "メタバースの新星",
    "sub": "神バーニング、ダブルオーダイバーアーク、プルタイン。最新作ビルドメタバースが描く、ガンプラバトルの新たな地平。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "神バーニング",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ダイバーアーク",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "プルタイン",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_battlogue",
    "universe": "BF",
    "no": 35,
    "group": "combo",
    "name": "ブレイカー バトローグ",
    "sub": "ガンダムヘリオス、リヴランスヘブン、ブレイジング。ゲーム発のブレイカー バトローグから、玄人をうならせる異形のガンプラたち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ヘリオス",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "リヴランスヘブン",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ブレイジングガンダム",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_cross_era",
    "universe": "BF",
    "no": 36,
    "group": "combo",
    "name": "跨時代の競演",
    "sub": "C.E.のビルドストライク、A.C.のフェニーチェ、U.C.のライトニングZ、A.D.のダブルオーダイバー。全ての時代へ捧げる、ガンプラという愛の形。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ビルドストライク",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "フェニーチェ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ライトニングZ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ダブルオーダイバー",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_freedom_motto",
    "universe": "BF",
    "no": 37,
    "group": "count",
    "name": "ガンプラに、限界はない",
    "sub": "ビルドシリーズの機体を15機。作品も時代も縦横無尽に飛び越えて、君の棚はガンプラバトルの闘技場と化す。「ガンプラは、自由だ!」",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ガンダムビルド",
        "accessory": true
      },
      "gte": 15
    }
  },
  {
    "id": "bf_all_build",
    "universe": "BF",
    "no": 38,
    "group": "count",
    "name": "ビルドの覇者",
    "sub": "ファイターズ、トライ、ダイバーズ、Re:RISE、メタバース……ビルド系を40機。シリーズの歴史そのものを、君は組み上げた。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ガンダムビルド",
        "accessory": true
      },
      "gte": 40
    }
  },
  {
    "id": "bf_base_limited",
    "universe": "BF",
    "no": 39,
    "group": "count",
    "name": "ガンダムベースの戦利品",
    "sub": "ガンダムベース限定カラーのビルド機を2機。店舗へ足を運んだ者だけが手にできる、特別塗装の証。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "series": "ガンダムビルド",
        "base": true,
        "accessory": true
      },
      "gte": 2
    }
  },
  {
    "id": "bf_petitgguy",
    "universe": "BF",
    "no": 40,
    "group": "count",
    "name": "プチッガイ収集癖",
    "sub": "手のひらサイズの『プチッガイ』を2体。集めだすと止まらない、ビルドシリーズの沼の入口。可愛さは、罪。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "count": {
        "nameIncludes": "プチッガイ",
        "accessory": true
      },
      "gte": 2
    }
  },
  {
    "id": "bf_psf",
    "universe": "BF",
    "no": 41,
    "group": "combo",
    "name": "完璧なる自由",
    "sub": "ガンダムパーフェクトストライクフリーダムと、そのルージュ。C.E. の二つの名機を一機に統合する、究極の『全部乗せ』。原作愛の暴走。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "パーフェクトストライクフリーダム",
            "nameExcludes": "ルージュ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "パーフェクトストライクフリーダムルージュ",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_super_fumina",
    "universe": "BF",
    "no": 42,
    "group": "combo",
    "name": "すーぱーふみな",
    "sub": "すーぱーふみなと、ういにんぐふみな。ガンプラ少女を擬人化…ではなく『ガンプラ化』した怪作。可動とプロポーションの探求は、ここに極まる。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "すーぱーふみな",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ういにんぐふみな",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_crossbone_gbft",
    "universe": "BF",
    "no": 43,
    "group": "combo",
    "name": "髑髏の二つの顔",
    "sub": "クロスボーン魔王と、X1フルクロス TYPE.GBFT。U.C. の海賊ガンダムが、ビルドの世界で二つの姿を得る。骸骨の意匠、健在。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "クロスボーンガンダム魔王",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "フルクロス TYPE.GBFT",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_transient",
    "universe": "BF",
    "no": 44,
    "group": "combo",
    "name": "トランジェントの煌めき",
    "sub": "トランジェントガンダムと、その発展機グレイシャー。アジア圏の人気を背負った、ビルドファイターズトライの隠れた主役格。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "トランジェントガンダム",
            "nameExcludes": "グレイシャー",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "グレイシャー",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_eldora",
    "universe": "BF",
    "no": 45,
    "group": "combo",
    "name": "エルドラの守護者",
    "sub": "Re:RISE のエルドラ軍——ブルート、ドートレス、ウィンダム。少年たちが救おうとした、もう一つの世界の機体たち。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "エルドラブルート",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "エルドラドートレス",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "エルドラウィンダム",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_break",
    "universe": "BF",
    "no": 46,
    "group": "combo",
    "name": "ビルドダイバーズブレイク",
    "sub": "シャイニングブレイク、G-エルス、ビルドガンマ。最新外伝ブレイクが描く、新世代ダイバーたちのガンプラ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "シャイニングブレイク",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "G-エルス",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ビルドガンマ",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_rerise_final",
    "universe": "BF",
    "no": 47,
    "group": "combo",
    "name": "リライジング",
    "sub": "アルスアースリィと、最終決戦機リライジングガンダム。Re:RISE の物語を締めくくる、ヒロトたちの集大成。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "アルスアースリィ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "リライジングガンダム",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_knights",
    "universe": "BF",
    "no": 48,
    "group": "combo",
    "name": "騎士の系譜",
    "sub": "ジャスティスナイトと、イージスナイト。SDガンダム外伝『ナイトガンダム』の意匠を、Re:RISE が現代に甦らせた、もう一つの原作愛。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ジャスティスナイト",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "イージスナイト",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_amazing_red",
    "universe": "BF",
    "no": 49,
    "group": "combo",
    "name": "紅の名人",
    "sub": "ガンダムアメイジングレッドウォーリアと、エクシアダークマター。三代目名人カワグチが駆る、赤と黒——王者の二面性。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "アメイジングレッドウォーリア",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ダークマター",
            "accessory": true
          }
        }
      ]
    }
  },
  {
    "id": "bf_world_tournament",
    "universe": "BF",
    "no": 50,
    "group": "combo",
    "name": "ガンプラバトル世界選手権",
    "sub": "ビルドストライク、フェニーチェ、戦国アストレイ、エクシアダークマター、ベアッガイ。世界の頂点を競った、ビルドファイターズ第一章の顔ぶれ。",
    "hidden": false,
    "scope": "full",
    "rule": {
      "all": [
        {
          "match": {
            "nameIncludes": "ビルドストライク",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "フェニーチェ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "戦国アストレイ",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ダークマター",
            "accessory": true
          }
        },
        {
          "match": {
            "nameIncludes": "ベアッガイ",
            "accessory": true
          }
        }
      ]
    }
  }
];
