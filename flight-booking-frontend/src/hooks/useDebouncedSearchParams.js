import { useEffect, useState } from "react";

export function useDebouncedSearchParams(initialValue = "", delay = 250) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm, delay]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
    clearSearch,
    setSearchTerm,
  };
}