$(".postComment").on("click", function(e) {
    e.preventDefault();

    var data = {
        data: $(".comment").val(),
        id: $(".comment").data("articleid")
    }
    
    $.ajax({
        url: window.location.origin + "/api/commented",
        method:"POST",
        data: data
    }).then(function(response) {
        console.log(response)
    })
})