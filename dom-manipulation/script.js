document.addEventListener("DOMContentLoaded", () => {
  let quotes = [];
  let categories = new Set();
  const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Mock API

  const quoteDisplay = document.getElementById("quoteDisplay");
  const newQuoteButton = document.getElementById("newQuote");
  const addQuoteForm = document.getElementById("addQuoteForm");
  const exportQuotesButton = document.getElementById("exportQuotes");
  const importFileInput = document.getElementById("importFile");
  const categoryFilter = document.getElementById("categoryFilter");
  const syncQuotesButton = document.getElementById("syncQuotes");

  function createAddQuoteForm() {
      addQuoteForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const quoteText = document.getElementById("quoteText").value.trim();
          const quoteCategory = document.getElementById("quoteCategory").value.trim();

          if (quoteText && quoteCategory) {
              const newQuote = { text: quoteText, category: quoteCategory };
              quotes.push(newQuote);
              categories.add(quoteCategory);
              saveQuotes();
              populateCategories();
              filterQuotes();
              addQuoteForm.reset();
              await syncWithServer(newQuote);
          }
      });
  }

  function loadQuotes() {
      const savedQuotes = localStorage.getItem("quotes");
      if (savedQuotes) {
          quotes = JSON.parse(savedQuotes);
          quotes.forEach((quote) => categories.add(quote.category));
          populateCategories();
          showRandomQuote();
      }
  }

  function saveQuotes() {
      localStorage.setItem("quotes", JSON.stringify(quotes));
  }

  function populateCategories() {
      categoryFilter.innerHTML = '<option value="all">All Categories</option>';
      Array.from(categories).map((category) => {
          const option = document.createElement("option");
          option.value = category;
          option.textContent = category;
          categoryFilter.appendChild(option);
      });
  }

  function showRandomQuote() {
      const selectedCategory = categoryFilter.value;
      const filteredQuotes =
          selectedCategory === "all"
          ? quotes
          : quotes.filter((quote) => quote.category === selectedCategory);

      if (filteredQuotes.length === 0) {
          quoteDisplay.textContent = "No quotes available for this category.";
          return;
      }

      const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      const randomQuote = filteredQuotes[randomIndex];
      quoteDisplay.textContent = `"${randomQuote.text}" - ${randomQuote.category}`;
      sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
  }

  function filterQuotes() {
      showRandomQuote();
  }

  exportQuotesButton.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(quotes, null, 2)], {
          type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quotes.json";
      a.click();
      URL.revokeObjectURL(url);
  });

  importFileInput.addEventListener("change", (event) => {
      const fileReader = new FileReader();
      fileReader.onload = function (event) {
          const importedQuotes = JSON.parse(event.target.result);
          quotes = [...quotes, ...importedQuotes];
          importedQuotes.forEach((quote) => categories.add(quote.category));
          saveQuotes();
          populateCategories();
          filterQuotes();
          alert("Quotes imported successfully!");
      };
      fileReader.readAsText(event.target.files[0]);
  });

  async function syncWithServer(newQuote = null) {
      try {
          const serverQuotes = await fetchQuotesFromServer();
          if (newQuote) {
              // Post new quote to server
              await postQuoteToServer(newQuote);
          }
          const combinedQuotes = mergeQuotes(quotes, serverQuotes);
          quotes = combinedQuotes;
          saveQuotes();
          populateCategories();
          filterQuotes();
          alert("Quotes synced with server!");
      } catch (error) {
          console.error("Error syncing with server:", error);
      }
  }

  async function fetchQuotesFromServer() {
      const response = await fetch(SERVER_URL);
      const serverQuotes = await response.json();
      return serverQuotes;
  }

  async function postQuoteToServer(quote) {
      await fetch(SERVER_URL, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(quote),
      });
  }

  function mergeQuotes(localQuotes, serverQuotes) {
      const allQuotes = [...localQuotes, ...serverQuotes];
      const uniqueQuotes = Array.from(
          new Set(allQuotes.map((q) => JSON.stringify(q)))
      );
      return uniqueQuotes.map((q) => JSON.parse(q));
  }

  syncQuotesButton.addEventListener("click", () => {
      syncWithServer();
  });

  loadQuotes();
  newQuoteButton.addEventListener("click", showRandomQuote);
  categoryFilter.addEventListener("change", filterQuotes);
  setInterval(syncWithServer, 300000); // Sync with server every 5 minutes
  createAddQuoteForm();
});