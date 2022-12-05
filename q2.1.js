//joining two tables to include team information

d3.csv("People.csv").then(
    (dataset1) => {
        d3.csv("Appearances.csv").then(
            (dataset2) => {
                //obtain team of player from dataset2 using player id
                dataset1.forEach(player => {
                    dataset2.forEach(team => {
                        if(player.playerID == team.playerID){
                            //add team name to the dataset1
                            Object.assign(player, {'Team':team.teamID})
                        }
                    })
                })
            }
        )
    }
)