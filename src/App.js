import { Fragment, useEffect, useRef, useState } from "react";
import './App.css';
import StarRating from "./StarRating";

const average = (arr) => arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const APIKEY = "9cf71097";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  
  //const [watched, setWatched] = useState([]);
  const [watched, setWatched] = useState(function(){
    const storedValue = localStorage.getItem('watched')
    return JSON.parse(storedValue);
  });

  function handleSelectMovie(id) {
    setSelectedId(selectedId => id === selectedId ? null : id);
  }

  function handleCloseMovie(){
    setSelectedId(null);
  }

  function handleAddWatched(movie){
    setWatched(watched => [...watched, movie]);
    //localStorage.setItem('watched', JSON.stringify([...watched, movie]))
  }

  function handleDeleteWatched(id){
    setWatched(watched => watched.filter(movie => movie.imdbID !== id));
  }

  useEffect(() => {
    localStorage.setItem('watched', JSON.stringify(watched))
  }, [watched])

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMovies(){ 
      try{
        setIsLoading(true);
        setError('');
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${APIKEY}&s=${query}`,
          {signal: controller.signal}
        );

        if(!res.ok) throw new Error("Something went wrong with fetching movies");

        const data = await res.json();
        if(data.Response === 'False') throw new Error('Movie not found');
        setMovies(data.Search);
        setError('');
      }
      catch(error){
        if(error.name !== "AbortErrot") {
          console.log(error.message);
          setError(error.message);
        }
      }
      finally{
        setIsLoading(false);
      }
    }
    if(query.length < 3){
      setMovies([]);
      setError('');
      return;
    }

    handleCloseMovie()
    fetchMovies();

    return () => controller.abort();
  }, [query]);

  return (
    <Fragment>
      <Navbar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList
              movies={movies}
              onSelectMovie={handleSelectMovie}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails 
              selectedId={selectedId} 
              onCloseMovie={handleCloseMovie} 
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <Fragment>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatched} />
            </Fragment>
          )}
        </Box>
      </Main>
    </Fragment>
  );
}

function Loader(){
  return (
    <Fragment>
      <p className="loader">Loading...</p>
    </Fragment>
  );
}

function ErrorMessage({message}){
  return (
    <Fragment>
      <p className="error">
        <span>⛔</span> {message}
      </p>
    </Fragment>
  );
}


function Navbar({children}){
  
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}


function Logo(){
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}


function NumResults({movies}){
  return (
    <p className="num-results">
        Found <strong>{movies.length}</strong> results
    </p>
  );
}


function Search({query, setQuery}){

  const inputEl = useRef(null);

  useEffect(() => {
    function callback(e){
      if(document.activeElement === inputEl.current) return;
      if(e.code === 'Enter'){
        inputEl.current.focus()
        setQuery('');
      } 
        
    }
    document.addEventListener('keydown', callback)

    return () => document.removeEventListener('keydown', callback)
  }, [setQuery]);

  return (
    <input
        className="search"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        ref={inputEl}
      />
  );
}


function Main({children}){
  return (
    <main className="main">
      {children}
    </main>
  );
}


function Box({children}){
  
  const [isOpen, setIsOpen] = useState(true);
  return(
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "–" : "+"}
      </button>
      { isOpen && children }
    </div>
  );
};


function MovieList({movies, onSelectMovie}){
  
  return (
    <Fragment>
      <ul className="list list-movies">
        {movies?.map((movie) => (
          <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
        ))}
      </ul>
    </Fragment>
  );
}


function Movie({movie, onSelectMovie}){
  return (
    <li key={movie.imdbID} onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({selectedId, onCloseMovie, onAddWatched, watched}){

  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const countRef = useRef(0);

  useEffect(()=>{
    if(userRating) countRef.current += 1;
  }, [userRating]);

  const isWatched = watched.map(movie => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(movie => 
      movie.imdbID === selectedId)?.userRating;

  const { 
    Title: title, 
    Year: year, 
    Poster: poster, 
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors : actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd(){
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(' ').at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    }
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(function() {
    function callback(e) {
      if(e.code === "Escape"){
        onCloseMovie()
      }
    }

    document.addEventListener("keydown", callback);

    return function() {
      document.removeEventListener("keydown", callback);
    }
  }, [onCloseMovie]);

  useEffect(function(){
    async function getMovieDetails() {
      try{
        setIsLoading(true);
        const res = await fetch(`http://www.omdbapi.com/?apikey=${APIKEY}&i=${selectedId}`)
        const data = await res.json();
        setMovie(data)
        setIsLoading(false)
      }
      catch(error){
        console.log(error);
      }
    }
    getMovieDetails();
  }, [selectedId])

  useEffect(function(){
    if(!title) return;
    document.title = `Movie | ${title}`;

    return function(){
      document.title = "UsePopcorn";
    }
  }, [title]);

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <Fragment>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poter of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span> {imdbRating}
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
            {
              !isWatched ?
              <Fragment>
                <StarRating 
                  maxRating={10} 
                  size={24} 
                  onSetRating={setUserRating} 
               />
              
              { userRating > 0 &&
                <button 
                className="btn-add"
                onClick={handleAdd}
                >
                + Add to list
                </button>
              }
              </Fragment>
              : <p>You rated this movie &nbsp; &nbsp; <span>⭐</span> {watchedUserRating}</p>
            }
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </Fragment>
      )}
    </div>
  );
}


function WatchedSummary({watched}){
  const avgImdbRating = parseFloat(average(watched.map((movie) => movie.imdbRating))).toPrecision(2);
  const avgUserRating = parseFloat(average(watched.map((movie) => movie.userRating))).toPrecision(2);
  const avgRuntime = Math.ceil(average(watched.map((movie) => movie.runtime)));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}


function WatchedMoviesList({watched, onDeleteWatched}){
  return (
    <Fragment>
      <ul className="list">
        {watched.map((movie) => (
          <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
        ))}
      </ul>
    </Fragment>
  );
}


function WatchedMovie({movie, onDeleteWatched}){
  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>

        <button className="btn-delete" onClick={() => onDeleteWatched(movie.imdbID)}>X</button>
      </div>
    </li>
  );
}