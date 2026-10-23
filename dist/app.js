
"use strict";

/*
  KAILASH KALAMKARI
  Mobile WhatsApp Catalogue Sharing Trial

  One batch -> Selected JPEGs + Product Text
  No paid API required.
  No customer data stored.
*/

const DISCOUNT = 0.10;
const MAX_SHARE_FILES = 99;

const selectedBatches = new Set();
const selectedPhotos = new Map();

let revision = 0;

const el = id => document.getElementById(id);

const money = amount =>
  "₹" + Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const salePrice = mrp =>
  Math.round(Number(mrp) * (1 - DISCOUNT) * 100) / 100;

function setStatus(message) {
  el("status").textContent = message;
}

function verified(batch) {
  return (
    batch.confirmed === true &&
    Number.isFinite(batch.mrp) &&
    batch.mrp > 0
  );
}

function getMessage(batch) {
  return [
    "KAILASH KALAMKARI",
    "",
    "FABRIC / DESIGN: " + batch.name,
    "MRP: " + money(batch.mrp),
    "AFTER 10% DISCOUNT: " + money(salePrice(batch.mrp)),
    "",
    "Subject to stock availability.",
    "Shipping charges confirmed separately."
  ].join("\n");
}

function create(tag, content, className) {
  const node = document.createElement(tag);

  if (content !== undefined) {
    node.textContent = content;
  }

  if (className) {
    node.className = className;
  }

  return node;
}

function invalidate() {
  revision++;
  el("queue").replaceChildren();

  setStatus(
    "Selection changed. Prepare selected batch again."
  );
}

function addBatchCard(batch) {
  const card = create("article");

  card.innerHTML = `
    <img class="thumb" alt="">

    <label>
      <input type="checkbox" class="batch-check">
      <strong></strong>
    </label>

    <small class="count"></small>

    <div class="price"></div>

    <label>
      Batch MRP
      <input
        type="number"
        class="batch-mrp"
        min="1"
        step="0.01"
      >
    </label>

    <label>
      <input type="checkbox" class="price-confirm">
      MRP verified for this batch
    </label>

    <small class="note"></small>
  `;

  const thumbnail = card.querySelector(".thumb");

  if (batch.photos.length) {
    thumbnail.src = batch.photos[0].url;
  }

  thumbnail.alt = batch.name;
  thumbnail.loading = "lazy";

  card.querySelector("strong").textContent = batch.name;

  const batchCheckbox = card.querySelector(".batch-check");
  const mrpInput = card.querySelector(".batch-mrp");
  const confirmInput = card.querySelector(".price-confirm");

  const priceDisplay = card.querySelector(".price");
  const note = card.querySelector(".note");

  mrpInput.value = batch.mrp;
  confirmInput.checked = batch.confirmed === true;

  function updatePrice() {
    if (Number.isFinite(batch.mrp) && batch.mrp > 0) {
      priceDisplay.textContent =
        money(salePrice(batch.mrp)) + " after 10% off";
    } else {
      priceDisplay.textContent = "Invalid MRP";
    }

    note.textContent = verified(batch)
      ? "MRP verified."
      : "Verify MRP before sharing.";
  }

  updatePrice();

  batchCheckbox.onchange = () => {
    if (batchCheckbox.checked) {
      selectedBatches.add(batch.id);
    } else {
      selectedBatches.delete(batch.id);
    }

    invalidate();
  };

  mrpInput.oninput = () => {
    batch.mrp = mrpInput.value.trim() === ""
      ? NaN
      : Number(mrpInput.value);

    batch.confirmed = false;
    confirmInput.checked = false;

    updatePrice();
    invalidate();
  };

  confirmInput.onchange = () => {
    batch.confirmed = confirmInput.checked;

    updatePrice();
    invalidate();
  };

  const details = create("details");

  details.append(
    create(
      "summary",
      "Select saree photos (" + batch.photos.length + ")"
    )
  );

  const actions = create("div", undefined, "actions");

  const selectAll = create(
    "button",
    "Select all photos",
    "secondary"
  );

  const clearAll = create(
    "button",
    "Clear photos",
    "secondary"
  );

  selectAll.type = "button";
  clearAll.type = "button";

  actions.append(selectAll, clearAll);
  details.append(actions);

  const gallery = create("div", undefined, "gallery");

  const photoSet = new Set(
    batch.photos.map((_, index) => index)
  );

  selectedPhotos.set(batch.id, photoSet);

  const checkboxes = [];

  function updateCount() {
    card.querySelector(".count").textContent =
      photoSet.size +
      " of " +
      batch.photos.length +
      " photos selected";
  }

  batch.photos.forEach((photo, index) => {
    const wrapper = create("label", undefined, "photo-item");

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = true;

    checkbox.setAttribute(
      "aria-label",
      "Select " + photo.name
    );

    const image = document.createElement("img");

    image.src = photo.url;
    image.alt = photo.name;
    image.loading = "lazy";

    const filename = create("small", photo.name);

    filename.style.display = "block";
    filename.style.overflowWrap = "anywhere";

    checkbox.onchange = () => {
      if (checkbox.checked) {
        photoSet.add(index);
      } else {
        photoSet.delete(index);
      }

      updateCount();
      invalidate();
    };

    checkboxes.push(checkbox);

    wrapper.append(checkbox, image, filename);
    gallery.append(wrapper);
  });

  function updateAll(checked) {
    photoSet.clear();

    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = checked;

      if (checked) {
        photoSet.add(index);
      }
    });

    updateCount();
    invalidate();
  }

  selectAll.onclick = () => updateAll(true);
  clearAll.onclick = () => updateAll(false);

  updateCount();

  details.append(gallery);
  card.append(details);

  el("cards").append(card);
}

function safeFilename(name, index) {
  let filename = String(name || `photo-${index + 1}.jpg`);

  filename = filename.replace(/[\\/:*?"<>|]/g, "_");

  if (!/\.(jpg|jpeg)$/i.test(filename)) {
    filename += ".jpg";
  }

  return `${String(index + 1).padStart(2, "0")}_${filename}`;
}

async function downloadPhoto(photo, index) {
  const response = await fetch(photo.url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Photo unavailable: " + photo.name);
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("Empty photo: " + photo.name);
  }

  if (
    blob.type &&
    !["image/jpeg", "image/pjpeg"].includes(blob.type)
  ) {
    throw new Error(
      "Unsupported image format: " + photo.name
    );
  }

  return new File(
    [blob],
    safeFilename(photo.name, index),
    { type: "image/jpeg" }
  );
}

function createSharePanel(batch, photos, files, version) {
  const article = create("article");

  article.style.marginBottom = "18px";

  article.append(
    create(
      "h2",
      batch.name + " · " + photos.length + " photos"
    )
  );

  article.append(
    create(
      "p",
      "Share selected JPEG photographs and product details with your customer."
    )
  );

  const actions = create("div", undefined, "actions");

  const shareButton = create(
    "button",
    "Share Photos + Text"
  );

  shareButton.type = "button";

  const copyButton = create(
    "button",
    "Copy Product Details",
    "secondary"
  );

  copyButton.type = "button";

  const message = document.createElement("textarea");

  message.readOnly = true;
  message.value = getMessage(batch);
  message.setAttribute(
    "aria-label",
    batch.name + " product details"
  );

  shareButton.onclick = async () => {
    if (
      version !== revision ||
      !verified(batch)
    ) {
      setStatus(
        "Selection or price changed. Prepare again."
      );
      return;
    }

    if (!navigator.share || !navigator.canShare) {
      setStatus(
        "This browser does not support JPEG file sharing."
      );
      return;
    }

    if (!navigator.canShare({ files })) {
      setStatus(
        "Cannot share these JPEG files on this device. " +
        "Try fewer photos."
      );
      return;
    }

    const text = getMessage(batch);

    shareButton.disabled = true;

    try {
      await navigator.share({
        files: files,
        text: text,
        title: batch.name
      });

      setStatus(
        "Sharing menu completed. Check WhatsApp to " +
        "see whether photos and text were both included. " +
        "Delivery is not confirmed."
      );
    } catch (error) {
      if (error.name === "AbortError") {
        setStatus("Sharing cancelled.");
      } else {
        setStatus(
          "Sharing failed: " +
          error.name +
          ". " +
          (error.message || "")
        );
      }
    } finally {
      shareButton.disabled = false;
    }
  };

  copyButton.onclick = async () => {
    if (
      version !== revision ||
      !verified(batch)
    ) {
      setStatus(
        "Price verification required. Prepare again."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        getMessage(batch)
      );

      setStatus(
        "Product details copied."
      );
    } catch {
      message.focus();
      message.select();

      setStatus(
        "Copy the highlighted text manually."
      );
    }
  };

  actions.append(shareButton, copyButton);

  article.append(actions);
  article.append(message);

  const details = create("details");

  details.append(
    create(
      "summary",
      "View selected photos"
    )
  );

  const gallery = create("div", undefined, "gallery");

  photos.forEach(photo => {
    const link = document.createElement("a");

    link.href = photo.url;
    link.download = photo.name;

    const image = document.createElement("img");

    image.src = photo.url;
    image.alt = photo.name;
    image.loading = "lazy";

    link.append(image, document.createTextNode("Download"));

    gallery.append(link);
  });

  details.append(gallery);
  article.append(details);

  return article;
}

if (!Array.isArray(batches)) {
  throw new Error("Catalogue batches are missing.");
}

batches.forEach(addBatchCard);

el("prepare").onclick = async () => {
  const prepareButton = el("prepare");
  const queue = el("queue");

  queue.replaceChildren();

  const selected = batches.filter(batch =>
    selectedBatches.has(batch.id)
  );

  if (!selected.length) {
    setStatus("Please select a saree batch.");
    return;
  }

  for (const batch of selected) {
    if (!verified(batch)) {
      setStatus(
        batch.name + ": MRP verification required."
      );
      return;
    }

    const count = selectedPhotos.get(batch.id)?.size || 0;

    if (count === 0) {
      setStatus(
        batch.name + ": Select at least one photo."
      );
      return;
    }

    if (count > MAX_SHARE_FILES) {
      setStatus(
        batch.name +
        ": Maximum " +
        MAX_SHARE_FILES +
        " photos per sharing attempt."
      );
      return;
    }
  }

  prepareButton.disabled = true;

  const currentRevision = revision;

  try {
    for (const batch of selected) {
      const indices = selectedPhotos.get(batch.id);

      const photos = batch.photos.filter(
        (_, index) => indices.has(index)
      );

      setStatus(
        "Preparing " +
        batch.name +
        ": " +
        photos.length +
        " photographs..."
      );

      const files = [];

      for (let index = 0; index < photos.length; index++) {
        const file = await downloadPhoto(
          photos[index],
          index
        );

        if (currentRevision !== revision) {
          return;
        }

        files.push(file);
      }

      if (currentRevision !== revision) {
        return;
      }

      queue.append(
        createSharePanel(
          batch,
          photos,
          files,
          currentRevision
        )
      );
    }

    setStatus(
      "Ready. Tap Share Photos + Text. " +
      "Select WhatsApp and your own test chat. " +
      "Check whether WhatsApp includes the text."
    );

    queue.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    queue.replaceChildren();

    setStatus(
      "Could not prepare catalogue: " +
      error.message
    );
  } finally {
    prepareButton.disabled = false;
  }
};
