"use strict";
(function($){
  // On document ready
  $.addEventListener( "DOMContentLoaded", function( event ) {
    let products = {};
    let indexed_products = {}
    let query_vars

    initialize();

    async function initialize() {
      // End early if JSON file was not loaded.
      try {
        products = await get_products();

        product_listings();
        quote();
      } catch ( error ) {
        if ( error.name === "SyntaxError" ) {
          console.log("Syntax error on the JSON file.");
        } else {
          console.log( error.message );
        }
        
        // TODO: show error message.
      }
    }

    function product_listings() {
      let category = null;
      let body_obj = $.querySelector("body");
      let body_category_class;
      
      // Exit early if not a product listing page.
      if ( $.querySelector(".product-page") === null ) {
        return false;
      }

      query_vars = get_query_vars();

      if ( "movies" in query_vars ) {
        category = "movies";
      } else if ( "songs" in query_vars ) {
        category = "songs";
      }

      if ( category === null ) {
        body_category_class = `products-all`;
      } else {
        body_category_class = `products-${category}`;
      }

      body_obj.classList.add( body_category_class );

      render_products( category );
      initialize_catalog_listeners();
    }

    // Low effort XMLHTTPRequest to get the JSON file stored
    function get_products() {
      return new Promise( function( resolve, reject ) {
        const request = new XMLHttpRequest();
        request.open("GET", "source/NikkiNacksProducts.json");
        request.overrideMimeType("application/json"); // Set MIME so class expects json rather than XML

        request.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            try {
              let parsed_JSON = JSON.parse( request.responseText )
              resolve( parsed_JSON["products"] );
            } catch ( error ) {
              // Likely Syntax Error
              reject( error );
            }
          } else {
            reject( new Error( "Failure response received while retrieving JSON file." ) );
          }
        };
        request.onerror = function () {
          reject( new Error( "Error while retrieving JSON file." ) );
        };

        request.send();
      } );
    }

    function render_products() {
      let category = "all";
      let category_title = "All Products";
      let products_list = $.querySelector(".products");

      // Set category
      if ( arguments.length > 0 ) {
        if ( arguments[0] == "songs" ) {
          category = "Song";
          category_title = "Songs";
        } else if ( arguments[0] == "movies" ) {
          category = "Movie";
          category_title = "Movies";
        } else {
          // Catch-all condition should there be unexpected arguments.
          category = "all";
        }
      }
      
      $.querySelector(".category-title").innerHTML = category_title;

      
      for ( let product in products ) {
        if ( category !== "all" && products[product].productType !== category ) {
          continue; // Skip this product if not of category except if we're loading all products
        }
        
        let new_release = false;

        if ( products[product].newRelease == true ) {
          new_release = true;
        }

        products_list.innerHTML += `
          <div class="col-xs-12 product">
            <div class="row">
              <div class="col-xs-1">
                <input type="checkbox" />
              </div>
              <div class="col-xs-8">
                <h3 data-new-release="${new_release}" data-category="${products[product].productType.toLowerCase()}">${products[product].productName}</h3>
                <div>
                  Price: <strong>$${products[product].productPrice.toFixed(2)}</strong>
                </div>
              </div>
              <div class="col-xs-3">
                <input type="number" min="1" max="100" name="${products[product].productId}" placeholder="Enter quantity" required disabled>
              </div>
            </div>
          </div>
        `;
      }
    }

    function get_query_vars() {
      var search_params = new URLSearchParams( window.location.search );
      var query_vars = {};

      for ( var key of search_params.keys() ) {
        query_vars[key] = search_params.get( key )
      }

      return query_vars;
    }

    function initialize_catalog_listeners() {
      document.querySelector(".products").addEventListener( "click", function ( event ) {
        if ( event.target.type == "checkbox" ) {
          let input_number = event.target.parentElement.parentElement.querySelector("input[type=number]");

          if (event.target.checked === true) {
            input_number.disabled = false;
            input_number.value = 1;
          } else {
            input_number.disabled = true;
            input_number.value = null;
          }
        }
      } );
    }

    function quote() {
      // Exit early if we're not in the quote page
      if ( $.querySelector(".quote") === null ) {
        return false;
      }

      map_products_to_id();

      let query_vars = get_query_vars();
      let products_html = [];
      let products_list = $.querySelector(".products");
      let total = 0;
      
      for ( let product_id in query_vars ) {
        let product_total = 0;

        if ( typeof indexed_products[product_id] !== "object" ) {
          // Exit early and show error message.
          break;
        }
        else {
          product_total = indexed_products[product_id].productPrice * query_vars[product_id];
          total += product_total;
         
          let new_release = false;

          if ( indexed_products[product_id].newRelease == true ) {
            new_release = true;
          }

          products_html.push(`
            <div class="col-xs-12 product">
              <div class="row">
                <div class="col-xs-8">
                  <h3 data-new-release="${new_release}" data-category="${indexed_products[product_id].productType.toLowerCase()}">${indexed_products[product_id].productName}</h3>
                  <div>
                    Price: <strong>$${indexed_products[product_id].productPrice.toFixed(2)}</strong>
                  </div>
                </div>
                <div class="col-xs-2">${query_vars[product_id]}</div>
                <div class="col-xs-2">$${product_total.toFixed(2)}</div>
              </div>
            </div>
          `);
        }
      }

      products_list.innerHTML += products_html.join("");

      // Create totals
      products_list.innerHTML += `
        <div class="col-xs-12">
          <div class="row">
            <div class="col-xs-8"></div>
            <div class="col-xs-2">Total</div>
            <div class="col-xs-2"><strong>$${total.toFixed(2)}</strong></div>
          </div>
        </div>
      `;

      initialize_quote_listeners();
    }

    function initialize_quote_listeners() {
      // Print quote
      $.getElementById("print_quote").addEventListener( "click", function( event ) {
        print();
      });
    }
    
    function map_products_to_id() {
      for ( let product of products ) {
        indexed_products[product.productId] = product;
      }
    }
  } );
})(document);