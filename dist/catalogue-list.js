"use strict";

const categoryNames = ["Bangalore Silk black\u0026white Dupattas","Bangalore Silk Black\u0026White Sarees","Bangalore Silk multicoloured Duppatas","Banglore Silk Colour Sarees","Chennuri Silk black\u0026white Sarees","Cotton black and white Sarees","Cotton Colour sarees","Cotton Silk dupattas","Ikkat silk duppatas 2200","Mangalagiri silk sarees colour","Mangalgiri Silk Sarees","Pure Cotton Black\u0026white Duppatas","Pure Cotton Multicoloured Duppatas","Pure Crape Silk Sarees","Pure Creepe Duppatas","Pure Gadwal Silk Sarees","Pure Ikkath Silk Sarees","Pure Kanchipuram floral duppatas","Pure Kanchipuram Silk Sarees","Pure Kanchipuram story duppatas","Pure Kota Tussar Silk Sarees","Pure Patola Silk Sarees","Pure Tussar Silk duppatas","Pure Tussar Silk Sarees","Semi kanchi Silk Black\u0026white Sarees","Semi Kanchi Silk Sarees"];

(function () {
  const cards = document.getElementById("cards");
  if (!cards) return;

  const section = document.createElement("section");
  section.innerHTML = `
    <h2>All Catalogue Categories</h2>
    <p class="muted">
      Folder directory snapshot. Sharing is enabled
      for the trial batches below.
    </p>
    <input
      id="categorySearch"
      type="search"
      placeholder="Search saree or dupatta type..."
      aria-label="Search catalogue categories"
      style="width:100%;padding:14px;font:inherit;
             border:1px solid #aaa;border-radius:10px"
    >
    <p id="categoryCount"></p>
    <div id="categoryList"></div>
    <h2>Available Sharing Trials</h2>
    <p class="muted">
      Select a trial batch below to share JPEG photos.
    </p>
  `;

  cards.before(section);

  const search = document.getElementById("categorySearch");
  const list = document.getElementById("categoryList");
  const count = document.getElementById("categoryCount");

  function render() {
    const term = search.value.trim().toLowerCase();
    const matches = categoryNames.filter(
      name => name.toLowerCase().includes(term)
    );

    list.replaceChildren();
    count.textContent =
      matches.length + " of " + categoryNames.length +
      " categories";

    for (const name of matches) {
      const row = document.createElement("div");
      row.textContent = "▸  " + name;
      row.style.cssText =
        "padding:13px 10px;border-bottom:1px solid #ddd9cd;" +
        "font-weight:500;";
      list.append(row);
    }
  }

  search.addEventListener("input", render);
  render();

  // Remove homepage photo previews only.
  document.querySelectorAll("#cards .thumb").forEach(
    image => image.style.display = "none"
  );
})();
