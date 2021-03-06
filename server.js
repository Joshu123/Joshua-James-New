var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var app = express();
var datetime = require('node-datetime');
var http = http = require('http').Server(app);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var nodemailer = require('nodemailer');

var JWT_SECRET = 'hermeszeus';

var db = null;
//var messages;
MongoClient.connect("mongodb://localhost:27017/hermius", function(err, dbconn){
	if (!err) {
		console.log("We are connected");
        db = dbconn;   
	}
	else
	{
		console.log("NOT CONNECTED");
	}
});

app.use(bodyParser.json());

app.use(express.static('public'));

server.listen(80);
io.on('connection', function(socket){
	console.log('IO CONNECTION SUCCESSFUL');
});



app.get('/messages', function(req, res, next){
	db.collection('messages', function(err, messagesCollection){
		messagesCollection.find().toArray(function(err, messages){
			return res.json(messages);

		});
		return	db.collection;
	});
});


app.get('/chat/messages', function(req, res, next){
	db.collection('chatMessages', function(err, chatMessagesCollection){
		chatMessagesCollection.find().toArray(function(err, chatMessages){
			return res.json(chatMessages);

		});
		return	db.collection;
	});
});

//Function to get chat messages by Room
app.get('/chat/messages/room', function(req, res, next){
	db.collection('chatMessages', function(err, chatMessagesCollection){
		chatMessagesCollection.find({room: null}).toArray(function(err, chatMessages){
			//console.log(chatMessages.text);
			//console.log(chatMessages.text);
			return res.json(chatMessages);
		});
		return	db.collection;
	});
});

//Function to get chat messages by Room Name for Front Angular Page
app.put('/chat/messages/roomNameAng', function(req, res, next){
	db.collection('chatMessages', function(err, chatMessagesCollection){
		//console.log("Hello 2");
		//console.log(req.body.meetingRoomName);
		chatMessagesCollection.find({room: req.body.meetingRoomName}).toArray(function(err, chatMessages){
			//console.log(chatMessages.text);
			//console.log(chatMessages.text);
			return res.json(chatMessages);
		});
		return	db.collection;
	});
});

//Function to get chat messages by Room
app.put('/chat/messages/roomNameArg', function(req, res, next){
	db.collection('chatMessages', function(err, chatMessagesCollection){
		console.log("Hello ");
		console.log(req.body.meetingRoomName);
		chatMessagesCollection.find({room: req.body.meetingRoomName}).toArray(function(err, chatMessages){
			//console.log(chatMessages.text);
			//console.log(chatMessages.text);
			return res.json(chatMessages);
		});
		return	db.collection;
	});
});


//Function to get rooms
app.get('/rooms', function(req, res, next){
	db.collection('rooms', function(err, messagesCollection){
		messagesCollection.find().toArray(function(err, messages){
			return res.json(messages);

		});
		return	db.collection;
	});
});

//Function to insert CHAT messages
app.post('/chat/messages', function(req, res, next){
	
	var now = new Date();
	var jsonDate = now.toJSON();

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);

	//console.log(req.body.newChatMessage);
	//console.log(req.body.newRoom);
	console.log(req.body.roomName);
	
	db.collection('chatMessages', function(err, chatMessagesCollection){
		var newChatMessage = {
			//room: req.body.newRoom,
			text: req.body.newChatMessage,
			user: user._id,
			username: user.username,
			date: jsonDate,
			room: req.body.roomName

			//roomId: room._id
		};
		chatMessagesCollection.insert(newChatMessage, {w:1}, function(err, newChatMessage){
			io.emit('{text: req.body.newChatMessage}');
			return res.send();
		});
	});
	//res.send();
});


//Function to select Room name
app.put('/newRoom', function(req, res, next){

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);
	//console.log(req.body.newRoom);
	db.collection('rooms', function(err, roomsCollection){
		var newRoom = {
			//room: req.body.newRoom,

			name: req.body.newRoom,
			//user: user._id,
			//username: user.username
		};
		roomsCollection.insert(newRoom, {w:1}, function(err, messages){
			//var token = jwt.encode(user, JWT_SECRET);
			//return res.json({token: token});
			return res.send();
		});

	});
	//res.send();
});

//Function to insert messages
app.post('/messages', function(req, res, next){

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);
	//console.log(req.body.roomName);
	db.collection('messages', function(err, messagesCollection){
		var newMessage = {
			//room: req.body.newRoom,
			text: req.body.newMessage,
			user: user._id,
			username: user.username
			
		};
		messagesCollection.insert(newMessage, {w:1}, function(err, messages){
			io.emit('{text: req.body.newMessage}');
			return res.send();
		});
	});
	//res.send();
});

//Function to remove messages
app.put('/messages/remove', function(req, res, next){

	var token = req.headers.authorization;
	//console.log(token);
	var user = jwt.decode(token, JWT_SECRET);

	
	db.collection('messages', function(err, messagesCollection){
		var messageId = req.body.message._id;
		//console.log(user._id);
		messagesCollection.remove({_id: ObjectId(messageId), user: user._id}, {w:1}, function(err, result){
			//console.log(result);
			return res.send();
		});
	});
});

//function to add users
app.post('/users', function(req, res, next){
	db.collection('users', function(err, usersCollection){
		
		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(req.body.password, salt, function(err, hash) {
		        // Store hash in your password DB. 
				var newUser = {
				username: req.body.username,
				password: hash
				
				};
				usersCollection.insert(newUser, {w:1}, function(err, messages){
				return res.send();
				});
		    });
		});

		
	});
	//res.send();
});

//function for signing in
app.put('/users/signin', function(req, res, next){
	console.log(req.body.username);
	db.collection('users', function(err, usersCollection){
		usersCollection.findOne({username: req.body.username}, function(err, user){
			bcrypt.compare(req.body.password, user.password, function(err, result){
				if(result){
					var token = jwt.encode(user, JWT_SECRET);
					return res.json({token: token});
				}
				else{
					return res.status(400).send();
				}
			});
		});
	});
	//res.send();
});

app.listen(3015, function () {
  console.log('Example app listening on port 3015!');
});

