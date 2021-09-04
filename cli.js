/**
 * Angle calculation provided by PatrickKR
 *
 * Copyright (c) 2020 PatrickKR
 *
 * Do not remove this header.
 */

const fs = require('fs');
const readline = require('readline');

String.prototype.replaceAll = function (org, dest) {
    return this.split(org).join(dest);
}

const utils = require('./utils');
const { inputs } = require('./cli_input.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let input = [];

process.stdout.write(inputs[0]);

rl.on('line', line => {
    input.push(line);
    if(input.length < inputs.length) process.stdout.write(inputs[input.length]);
    else rl.close();
}).on('close', () => {
    if(input.length < inputs.length) {
        console.log('\n\n변환을 취소합니다.');
        process.exit(0);
    }

    input = input.map(a => isNaN(a) ? a : Number(a));

    if(!fs.existsSync(input[0])) {
        console.log('해당 채보 파일이 없습니다.');
        process.exit(0);
    }

    const file = fs.readFileSync(input[0]);
    const adofai = utils.ADOFAIParser(file);

    if(!adofai.pathData && !adofai.angleData) {
        console.log('이 파일은 얼불춤 채보가 아닙니다.');
        process.exit(0);
    }

    let pathData;
    if(!adofai.pathData) pathData = utils.angleToPath(adofai.angleData);
    else pathData = adofai.pathData;

    adofai.actions = adofai.actions.filter(a => a.eventType != 'SetHitsound');
    adofai.settings.hitsound = 'Squareshot';

    const roads = pathData.split('');

    /**
     * PatrickKR Start
     */
    let last_tile_angle = 180;
    let twirl = false;

    const angle_map = {
        "L": 0,
        "W": 15,
        "H": 30,
        "Q": 45,
        "G": 60,
        "q": 75,
        "U": 90,
        "o": 105,
        "T": 120,
        "E": 135,
        "J": 150,
        "p": 165,
        "R": 180,
        "A": 195,
        "M": 210,
        "C": 225,
        "B": 240,
        "Y": 255,
        "D": 270,
        "V": 285,
        "F": 300,
        "Z": 315,
        "N": 330,
        "x": 345,
        "!": undefined,
        "5": undefined,
        "7": undefined
    }
    /**
     * PatrickKR End
     */

    for (let i in roads) {
        for (let key in angle_map) {
            if (roads[i] == key) {
                for (let sel in adofai.actions) {
                    if (adofai.actions[sel].floor == i) {
                        switch (adofai.actions[sel].eventType) {
                            case 'Twirl':
                                twirl = !twirl;
                                break;
                        }
                    }
                }

                /**
                 * PatrickKR Start
                 */
                if (key == '!') {
                    last_tile_angle -= 180;
                    if (last_tile_angle < 0) {
                        last_tile_angle += 360;
                    }
                    continue;
                }

                let result;
                if (!isNaN(key)) result = 180 - 360 / (+key)
                else result = 180 - (last_tile_angle - angle_map[key]);

                if (twirl) result = 360 - result;

                if (result <= 0) result += 360;
                if (result > 360) result -= 360;

                if (!isNaN(key)) last_tile_angle = twirl ? last_tile_angle + 360 / (+key) : last_tile_angle - 360 / (+key)
                else last_tile_angle = angle_map[key];
                /**
                 * PatrickKR End
                 */

                if(result <= 30) {
                    adofai.actions = adofai.actions.filter(a => a.eventType != 'SetHitsound' || a.floor < i || a.floor > i + 2);

                    adofai.actions.push({
                        "floor": Number(i),
                        "eventType": "SetHitsound",
                        "hitsound": "ReverbClack",
                        "hitsoundVolume": 100
                    });

                    if(pathData.length >= Number(i) + 1) adofai.actions.push({
                        "floor": Number(i) + 1,
                        "eventType": "SetHitsound",
                        "hitsound": "None",
                        "hitsoundVolume": 100
                    });

                    if(pathData.length >= Number(i) + 2) adofai.actions.push({
                        "floor": Number(i) + 2,
                        "eventType": "SetHitsound",
                        "hitsound": "Squareshot",
                        "hitsoundVolume": 100
                    });
                }
            }
        }
    }

    fs.writeFileSync('export.adofai', JSON.stringify(adofai));
});