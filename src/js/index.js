import debounce from "lodash.debounce";
import { error } from "@pnotify/core";
import "@pnotify/core/dist/PNotify.css";
import "@pnotify/core/dist/BrightTheme.css";
import Handlebars from "handlebars";
import countryCardTemplate from "bundle-text:../templates/country-card.hbs";
import countryListTemplate from "bundle-text:../templates/country-list.hbs";

const countryCardMarkup = Handlebars.compile(countryCardTemplate);
const countryListMarkup = Handlebars.compile(countryListTemplate);

const refs = {
  countryContainer: document.querySelector(`[data-country-container]`),
  searchInput: document.querySelector(`[data-search-input]`),
};

function fetchCountries(searchQuery) {
  const BASE_URL = `https://api.restcountries.com/countries/v5`;
  return fetch(`${BASE_URL}?q=${searchQuery}`, {
    headers: {
      'Authorization': 'Bearer rc_live_ca6e7d5715af46418cbf281d7c7971bb'
    }
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  });
}

const handleInput = debounce((e) => {
  const searchQuery = e.target.value.trim().toLowerCase();
  fetchCountries(searchQuery)
    .then((res) => {
      const allCountries = res.data.objects || [];
      const filteredCountries = allCountries.filter(country => country.names.common.toLowerCase().includes(searchQuery));
      const countryCount = filteredCountries.length;

      if (countryCount > 10) {
        error({
          text: "Too many matches found. Please enter a more specific query!",
          delay: 2000,
        });
        refs.countryContainer.innerHTML = "";
      } else if (countryCount >= 2 && countryCount <= 10) {
        const listData = filteredCountries.map(country => ({ name: country.names.common }));
        const listMarkup = countryListMarkup(listData);
        refs.countryContainer.innerHTML = listMarkup;
      } else if (countryCount === 1) {
        const country = filteredCountries[0];
        const cardData = {
          name: country.names.common,
          capital: country.capitals.map(capital => capital.name).join(", ") || "N/A",
          population: country.population,
          languages: country.languages || "N/A",
          flag: country.flag.url_svg || "N/A",
        }
        const cardMarkup = countryCardMarkup(cardData);
        refs.countryContainer.innerHTML = cardMarkup;
      } else {
        error({
          text: "No countries found. Please try again.",
          delay: 2000,
        });
        refs.countryContainer.innerHTML = "";
      }
    })
    .catch((err) => {
      console.error(err);
      refs.countryContainer.innerHTML = "";
    });
}, 500);

refs.searchInput.addEventListener(`input`, handleInput);
