var year = "2022";
var teams = [];
var events = {};

$(document).ready(function() {
    teams = localStorage.getItem("teams").split(',');
    if (!teams) teams = [];
    $('button#add_team_go').click(function(){
        addteam();
    });
    refresh();
});

function addteam(){
    var teamnum = $('input#add_team').val();
    if (teamnum!=="" && !teams.includes(teamnum+'')) teams.push(teamnum + '');
    localStorage.setItem("teams", teams);
    console.log("hit");
    refresh();
    
}

function refresh(){
    var data = {};
    // let events = new Object();
    
    var promises = teams.map(team => new Promise(resolve => {		//make API calls
        var url = 'https://www.thebluealliance.com/api/v3/team/frc' + team + '/events/' + year + '/statuses';
        resolve($.getJSON(url, 'accept=application/json&X-TBA-Auth-Key=NtgN6wmhfU31LHr9Jb7fm15EzGsyxXTmc0Wycbv4MalqDEJIYZu3oHOeYLmewH3P'));
    }));
    Promise.all(promises).then(results => {
        for (let i=0; i<results.length; i++){
            if (!results[i]) continue;
            for (var event in results[i]){
                if (!results[i][event]) continue;
                if(!results[i][event]["next_match_key"]) continue;
                events[event] = {id: 1e6, key: "---"};
                data[results[i][event]["team_key"]] = {
                    "event": event,
                    "next": {"id": results[i][event]["next_match"]
                }
                break;
            }
            data[teams[i]] = {"event": "", "next": "", "current": ""};
        }
    });
    // console.log(events);
    // console.log(Object.keys(events));

    promises = Object.keys(events).map(event => new Promise(resolve => {		//make API calls
        var url = 'https://www.thebluealliance.com/api/v3/event/' + event + '/matches/simple';
        resolve($.getJSON(url, 'accept=application/json&X-TBA-Auth-Key=NtgN6wmhfU31LHr9Jb7fm15EzGsyxXTmc0Wycbv4MalqDEJIYZu3oHOeYLmewH3P'));
    }));
    Promise.all(promises).then(results => {
        for (let i=0; i<results.length; i++){
            console.log(results[i]);
            if (!results[i]) continue;
            var event = results[i][0]["event_key"];
            for (var match in results[i]){
                // console.log(matchid(results[i][match]));
                // console.log(results[i][match]["winning_alliance"] !== "");
                if (results[i][match]["winning_alliance"] === "" && matchid(results[i][match]) < events[event]["id"]) {
                    events[event]["id"] = matchid(results[i][match]);
                    events[event]["key"] = results[i][match]["key"];
                }
            }
        }
    });

    for (var team in data) {
        data[team]["current"] = events[data[team]["event"]];
    }
    teams.sort((a,b)=> {(data[a]["next"]-data[a]["current"]) - (data[b]["next"]-data[b]["current"])});

    for (var team in teams) {
        // $('table#teams tbody').append(
        //     '<tr id="' + teamnum + '"> <td>' + teamnum + '</td> <td></td><td></td><td></td><td><button class="remove"></td></tr>'
        // );
        // $('input#add_team').val("");
        // $('input#add_team').focus();
    }
}

function matchid(match){
    return ['qm', 'ef', 'qf', 'sf', 'f'].indexOf(match["comp_level"])*10000 + match["set_number"]*1000 + match["match_number"];
}