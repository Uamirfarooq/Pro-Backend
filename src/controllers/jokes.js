// send joke to froned application

const jokes  = [
    {
        id: 1,
        name: 'Umair',
        title: "joke master"
    },
    {
        id: 2,
        name: 'Usama',
        title: "joke sub master"
    },
    {
        id: 3,
        name: 'Husnain',
        title: "joke trainer master"
    }
]

const jokesApi = async (req, res) => {
    
    res.send(jokes)
}

export default jokesApi