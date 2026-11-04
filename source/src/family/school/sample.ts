/**
 * A made-up school ("Fernhill Academy") with the same shape as a real school pack: used by the demo and the tests.
 * Real schools are never built into the app: a family pastes its own pack (School > Set up), and it is stored in the
 * family's own synced data, not in the public app.
 */
import type { SchoolPack } from './types'

export const SAMPLE_PACK: SchoolPack = {
  "id": "sample-y8",
  "name": "Fernhill Academy (sample)",
  "version": "2026-09-20",
  "generatedOn": "2026-09-20",
  "tutorGroup": "8F",
  "tutor": "Mr L Owen",
  "info": [
    {
      "label": "School",
      "value": "Fernhill Academy, a made-up school for the demo"
    },
    {
      "label": "Absence line",
      "value": "Call the school office before 8:45 am on each day of absence"
    },
    {
      "label": "Homework",
      "value": "Set on the school portal. Key Stage 3 expects about one hour a night"
    },
    {
      "label": "Attendance",
      "value": "Registration closes at 9:00"
    }
  ],
  "day": [
    {
      "label": "Arrival",
      "start": "08:30",
      "end": "08:40",
      "kind": "reg"
    },
    {
      "label": "Tutor time and registration",
      "start": "08:40",
      "end": "09:00",
      "kind": "reg"
    },
    {
      "label": "Period 1",
      "start": "09:00",
      "end": "10:00",
      "kind": "lesson",
      "period": 1
    },
    {
      "label": "Period 2",
      "start": "10:00",
      "end": "11:00",
      "kind": "lesson",
      "period": 2
    },
    {
      "label": "Break",
      "start": "11:00",
      "end": "11:20",
      "kind": "break"
    },
    {
      "label": "Period 3",
      "start": "11:20",
      "end": "12:20",
      "kind": "lesson",
      "period": 3
    },
    {
      "label": "Reading time",
      "start": "12:20",
      "end": "12:30",
      "kind": "reading"
    },
    {
      "label": "Period 4",
      "start": "12:30",
      "end": "13:30",
      "kind": "lesson",
      "period": 4
    },
    {
      "label": "Lunch",
      "start": "13:30",
      "end": "14:05",
      "kind": "lunch"
    },
    {
      "label": "Period 5",
      "start": "14:05",
      "end": "15:05",
      "kind": "lesson",
      "period": 5
    }
  ],
  "timetable": {
    "A": [
      [
        [
          "Geography",
          "8A/Gy1",
          "Ms A Brook"
        ],
        [
          "Drama",
          "8A/Dr1",
          "Mr B Carter"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "Religion & Philosophy",
          "8A/Rp1",
          "Ms E Foster"
        ]
      ],
      [
        [
          "Art & Design",
          "8A/Ad1",
          "Mr F Grant"
        ],
        [
          "English",
          "8A/En1",
          "Mrs G Hale"
        ],
        [
          "PE",
          "8A/Pe3",
          "Mr H Irving"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ]
      ],
      [
        [
          "English",
          "8A/En1",
          "Mrs G Hale"
        ],
        [
          "German",
          "8A/Ge1",
          "Ms I Jordan"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ],
        [
          "History",
          "8A/Hy1",
          "Mr J Kemp"
        ]
      ],
      [
        [
          "Geography",
          "8A/Gy1",
          "Ms A Brook"
        ],
        [
          "PE",
          "8A/Pe3",
          "Mr H Irving"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ],
        [
          "Design Tech",
          "8A/Dt2",
          "Mrs K Lowe"
        ]
      ],
      [
        [
          "Music",
          "8A/Mu1",
          "Mr L Marsh"
        ],
        [
          "English",
          "8A/En1",
          "Mrs G Hale"
        ],
        [
          "History",
          "8A/Hy1",
          "Ms M North"
        ],
        [
          "German",
          "8A/Ge1",
          "Ms I Jordan"
        ],
        [
          "Computer Studies",
          "8A/Cs1",
          "Mr N Oakley"
        ]
      ]
    ],
    "B": [
      [
        [
          "Design Tech",
          "8A/Dt2",
          "Mrs K Lowe"
        ],
        [
          "German",
          "8A/Ge1",
          "Ms I Jordan"
        ],
        [
          "PE",
          "8A/Pe3",
          "Mr H Irving"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "Drama",
          "8A/Dr1",
          "Mr B Carter"
        ]
      ],
      [
        [
          "History",
          "8A/Hy1",
          "Mr J Kemp"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ],
        [
          "Art & Design",
          "8A/Ad1",
          "Mr F Grant"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "English",
          "8A/En1",
          "Mrs G Hale"
        ]
      ],
      [
        [
          "Geography",
          "8A/Gy1",
          "Ms A Brook"
        ],
        [
          "Maths",
          "8A/Ma2",
          "Mr D Ellis"
        ],
        [
          "Design Tech",
          "8A/Dt2",
          "Mrs K Lowe"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ],
        [
          "English",
          "8A/En1",
          "Mrs O Pike"
        ]
      ],
      [
        [
          "German",
          "8A/Ge1",
          "Ms I Jordan"
        ],
        [
          "English",
          "8A/En1",
          "Mrs O Pike"
        ],
        [
          "Computer Studies",
          "8A/Cs1",
          "Mr N Oakley"
        ],
        [
          "Science",
          "8A/Sc1",
          "Mrs C Dawson"
        ],
        [
          "PE",
          "8A/Pe3",
          "Mr P Quinn"
        ]
      ],
      [
        [
          "Music",
          "8A/Mu1",
          "Mr L Marsh"
        ],
        [
          "Life Learning",
          "8A/Ll1",
          "Ms Q Reed"
        ],
        [
          "English",
          "8A/En1",
          "Mrs G Hale"
        ],
        [
          "Religion & Philosophy",
          "8A/Rp1",
          "Ms E Foster"
        ],
        [
          "Geography",
          "8A/Gy1",
          "Ms A Brook"
        ]
      ]
    ]
  },
  "weekAnchor": {
    "weekStart": "2026-09-21",
    "week": "B"
  },
  "weekConfirmedThrough": "2026-10-11",
  "terms": [
    {
      "name": "Autumn",
      "start": "2026-09-03",
      "end": "2026-12-18"
    },
    {
      "name": "Spring",
      "start": "2027-01-04",
      "end": "2027-03-25"
    },
    {
      "name": "Summer",
      "start": "2027-04-12",
      "end": "2027-07-21"
    }
  ],
  "closures": [
    {
      "start": "2026-09-18",
      "end": "2026-09-18",
      "name": "INSET day",
      "kind": "inset"
    },
    {
      "start": "2026-10-26",
      "end": "2026-10-30",
      "name": "Autumn half-term",
      "kind": "holiday"
    },
    {
      "start": "2026-11-27",
      "end": "2026-11-27",
      "name": "INSET day",
      "kind": "inset"
    },
    {
      "start": "2026-12-19",
      "end": "2027-01-03",
      "name": "Christmas break",
      "kind": "holiday"
    },
    {
      "start": "2027-02-15",
      "end": "2027-02-19",
      "name": "Spring half-term",
      "kind": "holiday"
    },
    {
      "start": "2027-02-22",
      "end": "2027-02-22",
      "name": "INSET day",
      "kind": "inset"
    },
    {
      "start": "2027-03-26",
      "end": "2027-04-11",
      "name": "Easter break",
      "kind": "holiday"
    },
    {
      "start": "2027-05-03",
      "end": "2027-05-03",
      "name": "Bank holiday",
      "kind": "holiday"
    },
    {
      "start": "2027-05-31",
      "end": "2027-06-04",
      "name": "Summer half-term",
      "kind": "holiday"
    },
    {
      "start": "2027-07-02",
      "end": "2027-07-02",
      "name": "INSET day",
      "kind": "inset"
    }
  ],
  "earlyClosures": [
    {
      "date": "2026-12-18",
      "name": "Last day of term (early closure)"
    },
    {
      "date": "2027-07-21",
      "name": "Last day of term (early closure)"
    }
  ],
  "clubs": [
    {
      "id": "club-1",
      "name": "Chess Club",
      "teacher": "Mr R Shaw",
      "day": 3,
      "start": "15:05",
      "room": "E4",
      "weekPattern": "every",
      "booked": true
    },
    {
      "id": "club-2",
      "name": "Drama rehearsal",
      "teacher": "Mrs S Tate",
      "day": 0,
      "start": "15:05",
      "room": "DR1",
      "weekPattern": "every",
      "booked": true
    },
    {
      "id": "club-3",
      "name": "Drama rehearsal",
      "teacher": "Mr B Carter",
      "day": 2,
      "start": "15:10",
      "room": "DR1",
      "weekPattern": "every",
      "booked": true
    },
    {
      "id": "club-4",
      "name": "Drama Club",
      "teacher": "Mr T Underwood",
      "day": 0,
      "start": "13:30",
      "minutes": 35,
      "weekPattern": "every",
      "booked": false,
      "spaces": 86
    },
    {
      "id": "club-5",
      "name": "Football",
      "teacher": "Ms U Vale",
      "day": 0,
      "start": "13:30",
      "minutes": 35,
      "weekPattern": "B",
      "booked": false,
      "spaces": 93
    },
    {
      "id": "club-6",
      "name": "Netball",
      "teacher": "Mr V Ward",
      "day": 0,
      "start": "15:15",
      "minutes": 45,
      "weekPattern": "every",
      "booked": false,
      "spaces": 81
    },
    {
      "id": "club-7",
      "name": "Art Club",
      "teacher": "Mrs W Young",
      "day": 1,
      "start": "15:05",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 52
    },
    {
      "id": "club-8",
      "name": "Science Club",
      "teacher": "Mr B Carter",
      "day": 1,
      "start": "15:10",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 2
    },
    {
      "id": "club-9",
      "name": "Book Club",
      "teacher": "Mr X Abbott",
      "day": 1,
      "start": "15:10",
      "minutes": 60,
      "weekPattern": "B",
      "booked": false,
      "spaces": 76
    },
    {
      "id": "club-10",
      "name": "Gardening Club",
      "teacher": "Mr X Abbott",
      "day": 1,
      "start": "15:10",
      "minutes": 65,
      "weekPattern": "A",
      "booked": false,
      "spaces": 43
    },
    {
      "id": "club-11",
      "name": "Basketball",
      "teacher": "Ms Y Bell",
      "day": 1,
      "start": "15:10",
      "minutes": 60,
      "weekPattern": "A",
      "booked": false,
      "spaces": 25
    },
    {
      "id": "club-12",
      "name": "Orchestra",
      "teacher": "Mr Z Cole",
      "day": 2,
      "start": "13:30",
      "minutes": 30,
      "weekPattern": "every",
      "booked": false,
      "spaces": 72
    },
    {
      "id": "club-13",
      "name": "Debating",
      "teacher": "Mrs A Dunn",
      "day": 2,
      "start": "13:30",
      "minutes": 30,
      "weekPattern": "every",
      "booked": false,
      "spaces": 83
    },
    {
      "id": "club-14",
      "name": "Dance",
      "teacher": "Mr B Eaton",
      "day": 2,
      "start": "13:30",
      "minutes": 35,
      "weekPattern": "every",
      "booked": false,
      "spaces": 98
    },
    {
      "id": "club-15",
      "name": "Hockey",
      "teacher": "Ms M North",
      "day": 2,
      "start": "15:05",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 89
    },
    {
      "id": "club-16",
      "name": "Astronomy Club",
      "teacher": "Mr R Shaw",
      "day": 2,
      "start": "15:05",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 67
    },
    {
      "id": "club-17",
      "name": "Board Games",
      "teacher": "Ms C Fry",
      "day": 2,
      "start": "15:05",
      "minutes": 70,
      "weekPattern": "every",
      "booked": false,
      "spaces": "Full"
    },
    {
      "id": "club-18",
      "name": "Homework Club",
      "teacher": "Mr D Gale",
      "day": 2,
      "start": "15:10",
      "minutes": 65,
      "weekPattern": "every",
      "booked": false,
      "spaces": 12
    },
    {
      "id": "club-19",
      "name": "Rugby",
      "teacher": "Mrs E Hart",
      "day": 2,
      "start": "15:10",
      "minutes": 65,
      "weekPattern": "every",
      "booked": false,
      "spaces": 40
    },
    {
      "id": "club-20",
      "name": "Running Club",
      "teacher": "Mr N Oakley",
      "day": 2,
      "start": "15:10",
      "minutes": 50,
      "weekPattern": "every",
      "booked": false,
      "spaces": 66
    },
    {
      "id": "club-21",
      "name": "Photography",
      "teacher": "Mr F Ives",
      "day": 3,
      "start": "13:30",
      "minutes": 30,
      "weekPattern": "B",
      "booked": false,
      "spaces": "Full"
    },
    {
      "id": "club-22",
      "name": "Film Club",
      "teacher": "Ms C Fry",
      "day": 3,
      "start": "15:05",
      "minutes": 70,
      "weekPattern": "every",
      "booked": false,
      "spaces": "Full"
    },
    {
      "id": "club-23",
      "name": "Cookery",
      "teacher": "Ms G Judd",
      "day": 3,
      "start": "15:05",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 80
    },
    {
      "id": "club-24",
      "name": "Model Making",
      "teacher": "Mr H Knox",
      "day": 3,
      "start": "15:10",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 54
    },
    {
      "id": "club-25",
      "name": "Yoga",
      "teacher": "Mrs W Young",
      "day": 3,
      "start": "15:10",
      "minutes": 65,
      "weekPattern": "every",
      "booked": false,
      "spaces": 63
    },
    {
      "id": "club-26",
      "name": "Eco Club",
      "teacher": "Mr X Abbott",
      "day": 3,
      "start": "15:10",
      "minutes": 65,
      "weekPattern": "A",
      "booked": false,
      "spaces": 47
    },
    {
      "id": "club-27",
      "name": "Robotics",
      "teacher": "Mrs I Lane",
      "day": 4,
      "start": "13:30",
      "minutes": 35,
      "weekPattern": "every",
      "booked": false,
      "spaces": 83
    },
    {
      "id": "club-28",
      "name": "History Club",
      "teacher": "Ms U Vale",
      "day": 4,
      "start": "13:30",
      "minutes": 35,
      "weekPattern": "every",
      "booked": false,
      "spaces": 93
    },
    {
      "id": "club-29",
      "name": "Creative Writing",
      "teacher": "Mr J Moss",
      "day": 4,
      "start": "15:10",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 39
    },
    {
      "id": "club-30",
      "name": "Table Tennis",
      "teacher": "Mr J Moss",
      "day": 4,
      "start": "15:10",
      "minutes": 60,
      "weekPattern": "every",
      "booked": false,
      "spaces": 79
    }
  ],
  "events": [
    {
      "date": "2026-10-07",
      "title": "Activities afternoon",
      "audience": "child"
    },
    {
      "date": "2026-10-16",
      "title": "Non-uniform day",
      "audience": "child"
    },
    {
      "date": "2026-11-12",
      "time": "17:00",
      "endTime": "19:00",
      "title": "Year 8 parents' evening",
      "audience": "parents"
    }
  ],
  "homework": [
    {
      "key": "sci-human-body-1",
      "subject": "Science",
      "title": "Human Body booklet, Task 1",
      "teacher": "Mrs C Dawson",
      "setOn": "2026-09-14",
      "due": "2026-09-28"
    },
    {
      "key": "eng-homework-one",
      "subject": "English",
      "title": "Homework One",
      "teacher": "Mrs G Hale",
      "setOn": "2026-09-16",
      "due": "2026-09-30"
    },
    {
      "key": "maths-ks3-hw",
      "subject": "Maths",
      "title": "KS3 Maths Homework",
      "teacher": "Ms K Nash",
      "setOn": "2026-09-16",
      "due": "2026-09-30"
    },
    {
      "key": "eng-much-ado-globe",
      "subject": "English",
      "title": "Much Ado about Nothing at The Globe theatre",
      "teacher": "Mrs O Pike",
      "setOn": "2026-09-08",
      "due": "2026-10-12"
    }
  ],
  "homeworkRules": {
    "A": "English, Maths and Science (up to 2 hours each)",
    "B": "Languages, Geography and History (up to 1 hour each)",
    "other": "Performance, Art, Design Tech, Computer Studies and RE tasks come twice per half-term.",
    "subjectsA": [
      "English",
      "Maths",
      "Science"
    ],
    "subjectsB": [
      "German",
      "Geography",
      "History"
    ]
  },
  "kit": {
    "PE": "PE kit"
  },
  "openQuestions": [
    "This is a made-up sample school, used in the demo and the tests."
  ]
}
