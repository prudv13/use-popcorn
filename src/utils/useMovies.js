import { useEffect, useState } from "react";

const APIKEY = "9cf71097";

export function useMovies(query, callback) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        callback?.()
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
    
        fetchMovies();
    
        return () => controller.abort();
    }, [query]);

  return {movies, isLoading, error}
}