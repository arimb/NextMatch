var year = "2022";
var teams = [];
var events = {};
var event_names = [];

$(document).ready(function() {
    teams = localStorage.getItem("teams");
    if (teams) teams = teams.split(',')
    else teams = [];
    $('button#add_team_go').click(function(){
        add_team();
    });
    refresh();
});

function add_team(){
    var teamnum = $('input#add_team').val();
    if (teamnum!=="" && !teams.includes(teamnum+'')) teams.push(teamnum + '');
    localStorage.setItem("teams", teams);
    $('input#add_team').val("");
    $('input#add_team').focus();
    refresh();
}

function remove_team(team){
    teams.splice(teams.indexOf(team), 1);
    localStorage.setItem("teams", teams);
    refresh();
}

function refresh(){
    var data = {};
    // let events = new Object();
    
    var team_status_promises = teams.map(team => new Promise(resolve => {		//make API calls
        var url = 'https://www.thebluealliance.com/api/v3/team/frc' + team + '/events/' + year + '/statuses';
        resolve($.getJSON(url, 'accept=application/json&X-TBA-Auth-Key=NtgN6wmhfU31LHr9Jb7fm15EzGsyxXTmc0Wycbv4MalqDEJIYZu3oHOeYLmewH3P'));
    }));
    Promise.all(team_status_promises).then(results => {
        for (let i=0; i<results.length; i++){
            if (!results[i]) continue;
            for (var event in results[i]){
                if (!results[i][event]) continue;
                if(!results[i][event]["next_match_key"]) continue;
                events[event] = {"id": 1e6, "key": "---"};
                event_names.push(event);
                var next_match_request = new XMLHttpRequest();
		        next_match_request.open('GET', 'https://www.thebluealliance.com/api/v3/match/' + results[i][event]["next_match_key"] + '/simple', false);
                next_match_request.setRequestHeader('X-TBA-Auth-Key', 'NtgN6wmhfU31LHr9Jb7fm15EzGsyxXTmc0Wycbv4MalqDEJIYZu3oHOeYLmewH3P');
                next_match_request.onload = function(){
                    data[teams[i]] = {
                        "event": event,
                        "next": {"key": results[i][event]["next_match_key"], "id": matchid(JSON.parse(this.response))}
                    }
                };
                next_match_request.onerror = function(){console.log("Error - " + results[i][event]["next_match"])};
                next_match_request.send();
                break;
            }
            if (!(teams[i] in data)) data[teams[i]] = {"event": "---", "next": {"id": 1e6, "key": "_---"}, "current": {"id": 0, "key": "_---"}};
        }

        event_matches_promises = event_names.map(event => new Promise(resolve => {		//make API calls
            var url = 'https://www.thebluealliance.com/api/v3/event/' + event + '/matches/simple';
            resolve($.getJSON(url, 'accept=application/json&X-TBA-Auth-Key=NtgN6wmhfU31LHr9Jb7fm15EzGsyxXTmc0Wycbv4MalqDEJIYZu3oHOeYLmewH3P'));
        }));
        Promise.all(event_matches_promises).then(results => {
            // console.log(results);
            for (let i=0; i<results.length; i++){
                // console.log(results[i]);
                if (!results[i]) continue;
                // console.log(results[i]);
                var event = results[i][0]["event_key"];
                for (var match in results[i]){
                    // console.log(matchid(results[i][match]));
                    // console.log(results[i][match]["winning_alliance"] !== "");
                    if (!results[i][match]["actual_time"] && matchid(results[i][match]) < events[event]["id"]) {
                        events[event]["id"] = matchid(results[i][match]);
                        events[event]["key"] = results[i][match]["key"];
                    }
                }
            }

            for (var team in data) {
                if (data[team]["event"] != "---")
                    data[team]["current"] = events[data[team]["event"]];
            }
            teams.sort((a,b)=> (data[a]["next"]['id']-data[a]["current"]['id']) - (data[b]["next"]['id']-data[b]["current"]['id']));

            console.log(data);
            console.log(teams);
            $('tbody').html('');
            for (var i in teams) {
                var team = teams[i];
                console.log(team);
                console.log(data[team]);
                $('table#teams tbody').append(
                    '<tr id="' + team + '"> <td>' + team + '</td> <td>' + data[team]['event'] + '</td> <td>' + trim_comp(data[team]['next']['key']) + '</td> <td>' + trim_comp(data[team]['current']['key']) + '</td> <td><button class="remove"></td> </tr>'
                );
            }
            $('tr button.remove').click(function(event){
                remove_team(event.target.parentElement.parentElement.id);
            })
        });
    });
}

function matchid(match){
    return ['qm', 'ef', 'qf', 'sf', 'f'].indexOf(match["comp_level"])*10000 + match["set_number"]*1000 + match["match_number"];
}

function trim_comp(key){
    return key.substring(key.search('_')+1);
}