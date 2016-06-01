# Tellyprompt

The site can be found at http://tellyprompt.com

Tellyprompt is a television discussion platform which connects to a database of television shows and allows users to engage in real-time text chat with others about specific episodes of their favourite shows. The site is fully responsive and mobile-oriented.

The site is built using:
* **NodeJS** - for the backend/server technology
* **Express** - a common Node webapp framework
* **Socket.IO** - for realtime client/server communications when sending chat messages
* **React** - for live updating the chat display and UI with new messages
* **mongoDB** - for storing messages, users, and favourites data
* **jQuery** - for general client-side functionality and scripting

Tellyprompt uses the http://themoviedb.org API for sourcing television show data and images.

## Functionality

### The homepage

After signing in, the homepage offers a search bar along with some stats about a random episode the user has favourited as well as the current most popular episode ( more stats and information could be added to this in future ). This information is fetched from the mongoDB database.

### Search functionality

Typing a show name into the search bar and hitting enter, either on the homepage or the dedicated search page, will bring back the resulting television show with the closest matching title. All seasons will be displayed of this show, and clicking on each of the season headers will load episode listings for that season. Clicking again will hide the season. This data is fetched through a series of calls to the themoviedb.org API. Season posters and episode screenshots provided through this API are used as the background of season and episode links, unless none are available in which case a default grey background colour is used.

Clicking on any individual episode will take the user to a chat page for that episode.

### Chat page

The chat page offers tellyprompt's main functionality. On this page, a user can type out a message in the text form at the bottom of the screen, and submit this message in real time to anyone else who is currently viewing the same episode's chat page. These messages are also stored to the mongoDB database, so that discussions are saved between sessions. Users can see the usernames of those they are talking to and the time the message was sent.

Real-time sending of messages is achieved using Socket.IO, a websockets framework designed for real-time communications. Clients send message data through Socket.IO to the Node/Express back-end, which then rebroadcasts this data to other clients in the same Socket 'room', i.e. those on the same episode's chat page. The back-end also stores these messages in a mongoDB-powered database. Client-side, the list display of messages is updated and maintained using React.

Also on the chat page is a heart-shaped favourite button in the top right corner. Clicking this will add or remove an episode from the user's favourites (by sending an AJAX call to the Node server). 

### Favourites

The favourites functionality allows users to mark an episode and its corresponding chat page as a favourite. This enables them to easily come back to the discussion by navigating to the favourites page, as opposed to searching for the show and then finding the season and episode. The favourites page displays a user's favourite episodes in pages of 5 (to decrease the number of necessary API calls to the TV database), and allows the user to browse through these pages. Users can then click on any of their favourite episodes to be taken to the corresponding chat page.

Adding a favourite also increases the popularity of an episode.

### Popular

The popular page displays the 5 most-favourited episodes on tellyprompt. This allows a user to see what shows and episodes are popular, and which they might like to watch and discuss. Popularity is  based on all-time favourite counts, although there is scope to build on this functionality in the future by adding time frames to this, e.g weekly or daily popular episodes.

### Page-loading

The main functionality of tellyprompt is set out as a single-page application. As such, different sections such as the favourites and chat pages are called from the server using AJAX requests. They are then displayed in the appropriate section of the page without the need for a whole page refresh. The browser history is updated accordingly using the HTML5 history API. This technique has the benefit of only needing to load the new data each time a section is loaded, rather than the complete page, including things like navigation, large stylesheets and javascript files.

## The mongoDB Database

The site uses a database powered by mongoDB. This database is used to store user information (username, email and encrypted password) for signup and login purposes. It also stores chat messages (username, message, date/time), as well as data about favourites and popular episodes.


