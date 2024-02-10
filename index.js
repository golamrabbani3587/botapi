const express = require('express');
const natural = require('natural');
var bodyParser = require('body-parser')
var cors = require("cors")
const mongoose = require('mongoose');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ type: 'application/json' }));
app.use(cors());


mongoose.connect('mongodb+srv://rrrr:GMHcvfpvTlbYVxHb@cluster0.nbrodly.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const trainDataSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const trainData = mongoose.model('trainData', trainDataSchema);


app.post('/train-data', async (req, res)=>{
    try{
        if( req.body ){
            let newData = await trainData.create(req.body)
            if( newData ){
                res.json({"success": true})
            }   
        }
    }
    catch(err){
        console.log(error);
    }
})

// Predefined questions and answers
// const qaPairs = [
//     { question: "What is your name?", answer: "My name is ChatBot." },
//     { question: "How are you?", answer: "I'm just a bot, but thanks for asking!" },
//     { question: "What time is it?", answer: "I'm sorry, I don't have access to real-time information." },
//     // Add more predefined questions and answers as needed
// ];
// Function to find the closest match to the user's query using Jaro-Winkler distance
let qaPairs = [];
async function findClosestMatch(userQuery) {
    let closestMatch = null;
    let maxScore = 0;

    qaPairs = await trainData.find({},{ question: 1, answer: 1, _id: 0 });
    console.log(qaPairs,'qap');

    qaPairs.forEach(pair => {
        const score = natural.JaroWinklerDistance(pair.question.toLowerCase(), userQuery.toLowerCase());
        if (score > maxScore) {
            maxScore = score;
            closestMatch = pair;
        }
    });

    return { match: closestMatch, score: maxScore };
}

// Route to handle incoming user queries
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    console.log(req.body, 'userquery');
    const response = await handleUserQuery(message);
    res.json({ response });
});

// Function to handle user queries
async function handleUserQuery(userQuery) {
    const { match, score } = await findClosestMatch(userQuery);
    if (match && score > 0.8) {
        return match.answer;
    } else {
        return "I'm sorry, I didn't understand your question.";
    }
}

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
