function generatePagination(currentPage, totalPages, search) {
    let paginationHTML = '<div class="row" data-aos="fade-up">';
    paginationHTML += '<div class="col-md-12 text-center">';
    paginationHTML += '<div class="site-block-27">';
    paginationHTML += '<ul>';
  
    if (currentPage > 1) {
        paginationHTML += `<li><a href="?page=${currentPage - 1}&search=${search}"><</a></li>`;
    }
  
    for (let j = 1; j <= totalPages; j++) {
        paginationHTML += `<li class="${currentPage === j ? 'active' : ''}"><a href="?page=${j}&search=${search}">${j}</a></li>`;
    }
  
    if (currentPage < totalPages) {
        paginationHTML += `<li><a href="?page=${currentPage + 1}&search=${search}">></a></li>`;
    }
  
    paginationHTML += '</ul>';
    paginationHTML += '</div>';
    paginationHTML += '</div>';
    paginationHTML += '</div>';
  
    return paginationHTML;
  }

  export default generatePagination;