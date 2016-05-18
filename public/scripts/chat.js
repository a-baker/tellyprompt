var socket = io();

var username = localUser;
var chat_url = "/api/messages/discussion/" + chat_id;

function scrollDown(){
    window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
}

function formatISOString(x){
    var date = new Date(x);
    var days = date.getDate();
    days = (days < 10) ? ("0" + days) : days;
    var months = date.getMonth();
    months = (months < 10) ? ("0" + months) : months;
    var hours = date.getHours();
    hours = (hours < 10) ? ("0" + hours) : hours;
    var minutes = date.getMinutes();
    minutes = (minutes < 10) ? ("0" + minutes) : minutes;

    var formattedDate =
        days + "/" + months + "/" + date.getFullYear() + " at " + hours + ":" + minutes;
    return formattedDate;
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
    }.bind(this));
  },
  render: function() {
    return (
      <div className="messageBox">
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
        <Message author={message.username} key={message._id} dateTime={formatISOString(message.dateTime)}>
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

    var tempDate = new Date();
    tempDate = tempDate.toISOString();

    if (!text) {
      return;
    }
    this.props.onMessageSubmit({username: username, content: text, dateTime: tempDate});
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
