var socket = io();

var username = "";
var userID = "";

var chat_url = "/api/messages/discussion/" + chat_id;

$.getJSON("/api/user_data", function(data) {
    // Make sure the data contains the username as expected before using it
    if (data.hasOwnProperty('username')) {
        console.log('Username: ' + data.username);
        username = data.username;
        userID = data.userID;
        console.log(userID);
    }
});

funtion scrollDown(){
    window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
}

$( ".postButton" ).click(function() {
  scrollDown();
});

var Message = React.createClass({
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  },

  render: function() {
    return (
      <div className="message">
        <h2 className="messageAuthor">
          {this.props.author}
        <span className="postTime">
            {this.props.dateTime}
        </span>
        </h2>
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

var MessageBox = React.createClass({
  loadMessagesFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  loadNewMessage: function(message) {
      var messages = this.state.data;
      var newMessages = messages.concat([message]);
      this.setState({data:newMessages});
      scrollDown();
  },
  handleMessageSubmit: function(message) {
    var messages = this.state.data;
    // Optimistically set an id on the new message. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    message._id = Date.now();

      socket.emit('message', message);

//    var newMessages = messages.concat([message]);
//    this.setState({data: newMessages});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: message,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: messages});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadMessagesFromServer();
    socket.on('message', function(msg){
        this.loadNewMessage(msg);

        console.log(msg);
        console.log(this.state.data);
    }.bind(this));
  },
  render: function() {
    return (
      <div className="messageBox">
        <h1>Messages</h1>
        <MessageList data={this.state.data} />
        <MessageForm onMessageSubmit={this.handleMessageSubmit} />
      </div>
    );
  }
});

var MessageList = React.createClass({
  render: function() {
    var messageNodes = this.props.data.map(function(message) {
      return (
        <Message author={message.username} key={message._id} dateTime={message.dateTime}>
          {message.content}
        </Message>
      );
    });
    return (
      <div className="messageList">
        {messageNodes}
      </div>
    );
  }
});

var MessageForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();

      //get date
      var today = new Date();
      var dd = today.getUTCDate();
      var mm = today.getUTCMonth()+1; //January is 0!
      var yyyy = today.getUTCFullYear();
      var hh = today.getUTCHours();
      var mn = today.getUTCMinutes();

      if(dd<10) {
          dd='0'+dd
      }

      if(mm<10) {
          mm='0'+mm
      }

      if(hh<10) {
          hh='0'+hh
      }

      if(mn<10) {
          mn='0'+mn
      }
      today = dd+'/'+mm+'/'+yyyy+" @ "+hh+":"+mn;

      var dateTime = today;


    if (!text) {
      return;
    }
    this.props.onMessageSubmit({username: username, content: text, dateTime: dateTime});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="messageForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

ReactDOM.render(
  <MessageBox url= {chat_url} />,
  document.getElementById('content')
);
