const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
let deleteBtns = document.querySelectorAll("#deleteBtn");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");

  newComment.dataset.id = id;
  newComment.className = "video__comment";

  const icon = document.createElement("i");
  icon.className = "fas fa-comment";

  const span = document.createElement("span");

  span.innerText = ` ${text}`;
  const span2 = document.createElement("span");
  span2.innerText = "🗑";
  span2.id = "deleteBtn";
  span2.className = "video__comment__deleteBtn";
  span2.addEventListener("click", handleDelete);
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);
};

const handleDelete = async (event) => {
  const li = event.target.parentElement;
  const {
    dataset: { id: commentId },
  } = li;
  li.remove();
  await fetch(`/api/comments/${commentId}/delete`, {
    method: "DELETE",
  });
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }

  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

if (deleteBtns) {
  deleteBtns.forEach((deleteBtn) => {
    deleteBtn.addEventListener("click", handleDelete);
  });
}

if (form) {
  form.addEventListener("submit", handleSubmit);
}
