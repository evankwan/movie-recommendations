const app = {};
app.key = '17756298f368266b1d9cdb193498987d';
app.descriptionHolder;

// cached selectors
app.$searchResults = $('.search-results');
app.$recSelect;
app.$recResults = $('.rec-results');
app.$inputChecked;
app.$searchId = $('#search');
app.$recContainer = $('rec-container');
app.$formSelector = $('form');

// obtain the searched movie from the form
app.getQuery = () => {
  app.$formSelector.on('submit', (e) => {
    e.preventDefault();
    const selection = app.$searchId.val();
    app.$recContainer.empty();
    app.searchMovie(selection);
  });
}

// calls the api to return a list of movies the user might want a recommendation based on
app.searchMovie = (query) => {
  $.ajax({
    url: `https://api.themoviedb.org/3/search/movie`,
    method: 'GET',
    dataType: 'json',
    data: {
      api_key: `${app.key}`,
      query: `${query}`
    }
  }).then( (res) => {
    if (res.results.length !== 0) {
      app.displayMovieList(res);
    } else {
      app.$searchResults.append(`
        <h2>No movies found, please try to search for a different movie</h2>
      `);
    }    
  });
}

// displays the list of movies to the user
app.displayMovieList = (movies) => {
  // empty in case of previous search
  // displaying title on screen
  app.$recResults.empty();
  app.$searchResults.empty();
  app.$searchResults.append(`
    <h2>Click the movie that you want a recommendation based on:</h2>
    <form action="#" method='GET' class='rec-select'>
    </form> 
  `);
  // caching new selector
  app.$recSelect = $('.rec-select');

  // storing array of movies for looping
  const moviesArray = movies.results;

  // shortening list of possible movies for better visual and navigation
  while (moviesArray.length > 8) {
    moviesArray.pop();
  }

  moviesArray.forEach((movie) => {
    // storing release date and cleaning data
    let releaseDate;

    if (movie.release_date !== undefined) {
      releaseDate = movie.release_date.split('-')[0];
    } else {
      releaseDate = 'unknown release date';
    }
    // adding movie details to screen
    app.$recSelect.append(`
      <div class='rec-select-container'>
        <input type="radio" name='movie-select' value='${movie.id}' id='${movie.id}'>
        <label for="${movie.id}">${movie.title} (${releaseDate})</label>
      </div>  
    `);
  });
  // add submit button to bottom of form
  app.$recSelect.append(`
    <button type="submit">Get Recs</button>
  `);
}

// to determine what movie the user wants a recommendation based on
app.getRecQuery = () => {
  app.$searchResults.on('submit', '.rec-select', (e) => {
    e.preventDefault();
    // caching selector
    app.$inputChecked = $('input:checked');
    const selection = app.$inputChecked.val();
    app.searchRecs(selection);
  })
}

// calls api to get list of recommended movies
app.searchRecs = (query) => {
  $.ajax({
    url: `https://api.themoviedb.org/3/movie/${query}/recommendations`,
    method: 'GET',
    dataType: 'json',
    data: {
      api_key: `${app.key}`
    }
  }).then( (res) => {
    if (res.results.length !== 0) {
      app.displayRecs(res);
    } else {
      app.$recSelect.append(`
        <h2 class='no-recs'>No recommendations found, please try to search for recommendations on a different movie</h2>
      `);
    }    
  });
}

// display the recommended movies on screen
app.displayRecs = (movies) => {
  // empty search results and rec-results
  app.$searchResults.empty();
  app.$recResults.empty();

  // storing array for looping
  const moviesArray = movies.results;

  moviesArray.forEach((movie) => {
    // adding each movie to the screen individually
    app.$recResults.append(`
      <div class='rec-container flex-parent'>
        <div class='wrapper movie-container flex-parent'> 
          <div class='image-container'>
            <img src="https://image.tmdb.org/t/p/original${movie.poster_path}" alt="${movie.title}">
          </div>
          <h2>${movie.title}</h2>
          <h4 class='where-to-watch' id='${movie.id}'>Where to watch</h4>
          <div class='movie-description-container ${movie.id}-description'>
          <p class='movie-description'>${movie.overview}</p>
          </div>
        </div>
      </div>
    `);
  }); 
}

// determine what movie the user wants to see availability online for
app.getAvailability = () => {
  app.$recResults.on('click', '.where-to-watch', function() {
    const selection = $(this).attr('id');
    
    // if we are reverting back to description
    if ($(`#${selection}`).text() === `Show Description`) {
      $(`#${selection}`).text('Where to watch');
      $(`.${this.id}-description`).empty();
      $(`.${this.id}-description`).append(`
        <p class='movie-description'>${app.descriptionHolder}</p>
      `);
    } else { // if we are looking for availability
      app.searchAvailability(selection);
    }
  });
}

// call api to return list of available watch channels for the chosen movie
app.searchAvailability = (query) => {
  $.ajax({
    url: `https://api.themoviedb.org/3/movie/${query}/watch/providers`,
    dataType: 'json',
    method: 'GET',
    data: {
      api_key: `${app.key}`
    }
  }).then(res => {
    // declaring array lists of available watch channels
    let streamChannels;
    let buyChannels;
    let rentChannels;

    if (res.results.CA !== undefined) { // if the option is available in Canada
      streamChannels = res.results.CA.flatrate;
      buyChannels = res.results.CA.buy;
      rentChannels = res.results.CA.rent;
    } else {
      streamChannels = undefined;
      buyChannels = undefined;
      rentChannels = undefined;
    }

    // calls helper function and stores new arrays 
    const streams = app.mapArray(streamChannels);
    const buy = app.mapArray(buyChannels);
    const rent = app.mapArray(rentChannels);


    app.displayAvailability(res, streams, buy, rent);
  });
}

// display the watch availability on screen
app.displayAvailability = (movie, streamChannels, buyChannels, rentChannels) => {

  // checking all movies to see if their description needs to be replaced before wiping the held description
  const whereToWatchArray = $('.where-to-watch');
  for (let i = 0; i < whereToWatchArray.length; i++) {
    if (whereToWatchArray[i].textContent === 'Show Description') {
      let sibling = whereToWatchArray[i].nextElementSibling;
      $(sibling).empty();
      $(sibling).append(`
        <p class='movie-description'>${app.descriptionHolder}</p>
      `);
      $(whereToWatchArray[i]).text('Where To Watch');
    }
  }

  // reverts the 'where to watch' text to show description
  $(`#${movie.id}`).text('Show Description');
  
  // grabs movie description and holds
  app.descriptionHolder = $(`.${movie.id}-description`).text();

  // empties the description div
  $(`.${movie.id}-description`).empty();

  // calls helper function to add channels to screen or tell user if there are no available channels

  app.channelAvailability(movie, streamChannels, 'streaming');
  app.channelAvailability(movie, buyChannels, 'purchasing');
  app.channelAvailability(movie, rentChannels, 'rental');
}

// helper function to cycle through objects and return the provide name to the array and if the array is undefined, return a null array
app.mapArray = (elements) => {
  if (elements !== undefined) {
    const array = elements.map( element => {
      return element.provider_name
    });
    return array
  } else {
    return null
  }
}

// helper function to cycle through channels and display to screen
app.channelAvailability = (movie, channels, term) => {
  if (channels !== null) {
    $(`.${movie.id}-description`).append('<h6>Where to stream:</h6>');
    channels.forEach(channel => {
      $(`.${movie.id}-description`).append(`
        <p class='channel'>${channel}</p>
      `);
    })
  } else {
    $(`.${movie.id}-description`).append(`<h6>No ${term} locations found!</h6>`);
  }
}

app.init = () => {
  app.getQuery();
  app.getRecQuery();
  app.getAvailability();
}

$(function() {
  app.init();
})