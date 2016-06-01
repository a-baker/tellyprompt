# Tellyprompt

Tellyprompt is a television discussion platform which connects to a database of television shows and allows users to engage in real-time text chat with others about specific episodes of their favourite shows. The site is fully responsive and mobile-oriented.

The site is built using:
* **NodeJS** - for the backend/server technology
* **Express** - a common Node webapp framework
* **Socket.IO** - for realtime client/server communications when sending chat messages
* **React** - for live updating the chat display and UI with new messages
* **mongoDB** - for storing messages, users, and favourites data
* **jQuery** - for general client-side functionality and scripting

## The homepage

After signing in, the homepage offers a search bar along with some stats about a random episode the user has favourited as well as the current most popular episode ( more stats and information could be added to this in future ).

## Search functionality

Typing a show name into the search bar and hitting enter, either on the homepage or the dedicated search page, will bring back the resulting television show with the closest matching title. All seasons will be displayed of this show, and clicking on each of the season headers will load episode listings for that season. Clicking again will hide the season.

Clicking on any individual episode will take the user to a chat page for that episode.

## Chat page

The chat page offers tellyprompt's main functionality. On this page, a user can type out a message in the text form at the bottom of the screen, and submit this message in real time to anyone else who is currently viewing the same episode's chat page. These messages are also stored to the mongoDB database, so that discussions are saved between sessions. Users can see the usernames of those they are talking to and the time the message was sent.

Also on the chat page is a heart-shaped favourite button in the top right corner. Clicking this will add or remove an episode from the user's favourites. 

## Favourites

The favourites section allows users to mark an episode and its corresponding chat page as a favourite. This enables them to easily come back to the discussion by going through their favourites section, as opposed to searching for the show and then finding the season and episode. The favourites page displays a user's favourite episodes in pages of 5 (to decrease the number of necessary API calls to the tv database), and allows the user to browse through these pages.

Adding a favourite also increases the popularity of an episode.

## Popular

The popular page displays the 5 most-favourited episodes on tellyprompt. This allows a user to see what shows and episodes are popular, and which they might like to watch and discuss. Popularity is  based on all-time favourite counts, although there is scope to build on this functionality in the future by adding time frames to this, e.g weekly or daily popular episodes.


