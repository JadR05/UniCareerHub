const fsPromises = require('fs').promises;
const path = require('path');
const { format, parse } = require('date-fns');
const dateFormat = "dd/MM/yyyy hh:mm:ss a";
const crypto = require('crypto');
const reviewsDB = 
{
    reviews: require('../model/reviews.json'),
    setReviews: function (data) { this.reviews = data }
};

const postReview = async (req,res)=>
{
    const postId = crypto.randomUUID();
    const dateTime = format(new Date(), "dd/MM/yyyy hh:mm:ss a");
    const user = req.user.username;
    const {operation,title,review,company,industry} = req.body;            //,category
    if(operation === 'remove')
    {
        const existingUser = reviewsDB.reviews.find(person => person.username === user);
        if (existingUser) 
        {
            existingUser.reviews = existingUser.reviews.filter(r => !(r.ID =ID));
            reviewsDB.setReviews(reviewsDB.reviews.filter(person => person.username !== user || person.reviews.length > 0))
          
        await fsPromises.writeFile(
            path.join(__dirname, '..', 'model', 'reviews.json'),
            JSON.stringify(reviewsDB.reviews))
        }
        return res.redirect('/reviews');
    }
    else
    {
    const existingUser = reviewsDB.reviews.find(person => person.username===user);
    if(!existingUser)
    {
        const newReviewer = 
        {
            "username": user,
            "reviews": 
            [
                {
            "ID": postId,
            "title": title,
            "company-name": company,
            "review": review,
            "industry": industry,
            "time": dateTime,
                }
            ]
        }
        reviewsDB.setReviews([...reviewsDB.reviews, newReviewer]);
    }
    else
    {
        existingUser.reviews.push({
            "ID": postId,
            "title": title,
            "company-name": company,
            "review": review,
            "industry": industry,
            "time": dateTime,})
    }
    await fsPromises.writeFile
    (
        path.join(__dirname, '..', 'model', 'reviews.json'),
        JSON.stringify(reviewsDB.reviews)
    );
    return res.status(200).json({ message: 'Review posted successfully' });
}
}
const getLatestReviews = async(req,res)=>
{
    try
    {
        const data = await fsPromises.readFile(path.join(__dirname, '..', 'model', 'reviews.json'), 'utf8');
        const reviewsDB = JSON.parse(data);
        const listOfReviews = [];
        reviewsDB.forEach(userObj => 
        {
            userObj.reviews.forEach
            (
                q=> 
                {
                    listOfReviews.push({ ...q, username: userObj.username });
                }
            );
        });
        listOfReviews.sort((a, b) => 
            {
            const dateA = parse(a.time, dateFormat, new Date());
            const dateB = parse(b.time, dateFormat, new Date());
            return dateB - dateA;
            });
          const latest10 = listOfReviews.slice(0, 10);
          res.status(200).json(latest10);
    }
    catch (error) 
    {
        console.error(error);
        res.status(500).send("Server error");
    }
}
module.exports = {postReview,getLatestReviews};