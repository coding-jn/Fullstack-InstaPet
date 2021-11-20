var like = document.getElementsByClassName("fa-heart");
var trash = document.getElementsByClassName("fa-trash");

Array.from(like).forEach(function(element) {
      element.addEventListener('click', function(){
        const postId = this.parentNode.parentNode.childNodes[1].innerText
        const numLikes = parseFloat(this.parentNode.innerText)
        fetch('posts', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            'postId': postId,
            'likes': numLikes
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});

Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        const postId = this.parentNode.parentNode.childNodes[1].innerText
        fetch('posts', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'postId': postId,
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});
