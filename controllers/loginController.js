const usersDB = 
{
    users: require('../model/users.json'),
    setUsers: function (data) { this.users = data }
};
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');

const handleLogin = async (req, res) => 
{
    const { user, password } = req.body;
    if (!user || !password) 
    {
        return res.status(400).json({ 'message': 'Username and password are required.' });
    }
    const foundUser = usersDB.users.find(person => person.username === user);
    if (!foundUser) 
    {
        return res.sendStatus(401); //Unauthorized 
    }
    const match = await bcrypt.compare(password, foundUser.password); // evaluate password 
    if (match) 
    {
        console.log('there is a match');
        const roles = Object.values(foundUser.roles); // create JWTs
        const accessToken = jwt.sign(
            {
            "UserInfo":
                {
                    "username": foundUser.username,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { 
                expiresIn: '5m' 
            }
        );
        const refreshToken = jwt.sign(
            { 
                "username": foundUser.username 
            },
            process.env.REFRESH_TOKEN_SECRET,
            { 
                expiresIn: '1d' 
            }
        );
        // Saving refreshToken with current user
        const otherUsers = usersDB.users.filter(person => person.username !== foundUser.username);
        const currentUser = { ...foundUser, refreshToken };
        usersDB.setUsers([...otherUsers, currentUser]);
        await fsPromises.writeFile(
            path.join(__dirname, '..', 'model', 'users.json'),
            JSON.stringify(usersDB.users)
        );
        //secure: true          USE THIS WHEN WE GO LIVE(WHEN WE BECOME HTTPS)
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000, path:'/'});
        res.json({ accessToken });
    } 
    else 
    {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };