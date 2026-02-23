import { useState } from 'react';
import axios from "axios"

function App() {
  const [description, setDescription] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false)


  const LAMBDA_URL = "https://24zyovdbg3.execute-api.us-east-2.amazonaws.com/default/book-finder-api"

  const searchBooks = async () => {
    setSearched(true)
    if (!description.trim()) {
      setError('Please enter a book description');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setBooks([]);
    setError('');

    try {
      const { data } = await axios.post(LAMBDA_URL, { description });

      // FIX: check for empty results instead of checking for a "message" key
      if (!data.books || data.books.length === 0) {
        setError('No books found.');
        return;
      }

      setBooks(data.books);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to search for books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIX: removed unnecessary async
  const clearBooks = () => {
    setSearched(false)
    setLoading(false);
    setBooks([]);
    setError('');
    setDescription('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // FIX: removed duplicate setSearched(true) call here, searchBooks sets it
      searchBooks();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-5">
      <div className="max-w-4xl mx-auto pt-10">
        {/* Header */}
        <header className="text-center text-white mb-10">
          <h1 className="text-5xl font-bold mb-3">📚 BookID</h1>
          <p className="text-xl opacity-90">
            Describe the book you're looking for and discover your next read
          </p>
        </header>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="mb-5">
            <label 
              htmlFor="bookDescription" 
              className="block mb-2 font-semibold text-gray-700"
            >
              What kind of book are you looking for?
            </label>
            <textarea
              id="bookDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., A mystery novel set in Victorian London, a science fiction book about space exploration, a self-help book about productivity..."
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors resize-y min-h-[100px] text-base"
              rows="4"
            />
          </div>
          
          <button
            onClick={searchBooks}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Searching...' : 'Find Books'}
          </button>
          {books.length > 0 && <button
            onClick={clearBooks}
            disabled={loading}
            className="w-full mt-3 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            Clear Books
          </button>}
          
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white text-xl mb-5">
            <p>🔍 Searching for books...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-5 animate-slideIn">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && books.length > 0 && (
          <div className="space-y-5">
            {books.map((book, index) => (
              // FIX: more stable key using title + index
              <BookCard key={`${book.title}-${index}`} book={book} />
            ))}
          </div>
        )}

        {!loading && searched && books.length === 0 && description && !error && (
          <div className="bg-white rounded-xl p-5 text-center text-gray-600">
            No books found. Try a different description.
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex gap-5">
      <img
        src={book.thumbnail}
        // FIX: use a reliable inline SVG data URI fallback instead of third-party placeholder
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180' viewBox='0 0 120 180'%3E%3Crect width='120' height='180' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%236b7280'%3ENo Cover%3C/text%3E%3C/svg%3E`;
        }}
        alt={book.title}
        // FIX: replaced w-30 h-45 (invalid Tailwind classes) with explicit pixel dimensions
        className="w-[120px] h-[180px] object-cover rounded-lg flex-shrink-0 bg-gray-100"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {book.title}
        </h3>
        
        <p className="text-primary-600 font-semibold mb-3">
          {book.authors || 'Unknown Author'}
        </p>
        
        <p className="text-gray-600 leading-relaxed mb-3">
          {book.description || 'No description available.'}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {book.publishedDate && (
            <span>📅 {book.publishedDate}</span>
          )}
          {book.pageCount && (
            <span>📖 {book.pageCount} pages</span>
          )}
          {book.categories && (
            <span>🏷️ {book.categories}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;