//Apulaiset
var kartta;

function alustaKartta(osoite) {
  var geokoodaaja = new google.maps.Geocoder();
  kartta = new google.maps.Map(document.getElementById("kartta"), {
    zoom: 16,
    center: { lat: 61.500, lng: 23.760 }
  });
  if (osoite == "")
    osoite = "Tampere";
  geokoodaaja.geocode({
      address: osoite
  }, function(tulos, tila) {
      if (tila == "OK") {
        var merkki = new google.maps.Marker({
            map: kartta,
            position: tulos[0].geometry.location
        });
        google.maps.event.trigger(kartta, "resize");
        kartta.setCenter(merkki.getPosition());
      } else {
        alert("Virhe:" + tila);
      }
    });
}


//Pääohjelma
$(document).ready(function () {
  alustaKartta("Tampere");

  //Tiedot näkymä
  var tiedot = $("#tiedot");

  //DOM elementit
  var otsikko = $(".otsikko");
  var kuva = $(".kuva");
  var paikka = $(".paikka");
  var kuvaus = $(".kuvaus");
  var linkki = $(".linkki");
  var aika = $(".aika");
  var ajat = $(".ajat");

  //Lista näkymä
  var lista = $("#lista");

  //DOM elementit
  var osumat = $("#osumat");
  var tulokset = $("#tulokset");

  //Suodatus näkymä
  var suodatus = $("#suodatus");

  //DOM elementit
  var paiva = $("#paiva-teksti");
  var kalenteri = $("#kalenteri");
  var paivat = $("#paivat").children();
  var suodata = $("#suodata");
  var sijainti = $("#sijainti");
  var suosikit = $("#suosikit");

  //Ulkoasun asetukset
  $(window).on("resize", function() {
      if ($(window).width() < 600)
          suosikit.html("<span class=\"glyphicon glyphicon-star\" aria-hidden=\"true\"></span>");
      else
          suosikit.html("Näytä suosikit");
  });

  kalenteri.datepicker({
    todayBtn: "linked",
    language: "fi",
    multidate: true,
    todayHighlight: true
  });

  sijainti.on("shown.bs.modal", function() {
     alustaKartta($(this).attr("data-osoite"));
  });

  suosikit.on("click", function() {
      $(".lisatietopainike").unbind("click");
      tulokset.html("");
      var tapahtuma_id = Object.keys(localStorage);
      var i = tapahtuma_id.length
      while (i--) {
          tulokset.append(localStorage.getItem(tapahtuma_id[i]));
          uusi = tulokset.children().last();
          uusi.find(".kartalla").on("click", function() {
              sijainti.attr("data-osoite", uusi.find(".paikka").html());
          });
      }
      tulokset.find(".lisatiedot").hide();
      tulokset.find(".lisatietopainike").on("click", function() {
          if ($(this).parent().siblings(".lisatiedot").is(":visible"))
              $(this).parent().siblings(".lisatiedot").slideUp();
          else
              $(this).parent().siblings(".lisatiedot").slideDown();
      });
      osumat.html(tapahtuma_id.length + " osumaa");
  });

  suodata.trigger("click");

  suodata.on("click", function() {
    //Suodatuskyselyn aloitus
    $(".lisatietopainike").unbind("click");
    tulokset.html("")

    var osumamaara = 0;
    var paivamaarat = kalenteri.datepicker("getUTCDates");
    paivamaarat.sort(function(a, b) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    });

    for (var avain in paivamaarat) {
        var haku = [];
        haku.push("https://visittampere.fi/api/search?type=event");

        //Päivän lisäys suodatuskyselyyn
        haku.push("start_datetime=" + paivamaarat[avain].getTime());
        haku.push("end_datetime=" + paivamaarat[avain].getTime());

        //Tagien lisäys suodatuskyselyyn
        var tagit = [];
        $("#suodatus input").each(function() {
          if ($(this).prop("checked")) {
              tagit.push("\"" + $(this).attr("id") + "\"");
          }
        });

        if (tagit.length != 0)
          haku.push("tag=[" + tagit.join() + "]");
        else if (tagit.length == 1)
          haku.push("tag=" + tagit[0]);

        (function(i) {
            $.getJSON(haku.join("&"), function(tapahtumat) {
              tulokset.append("<h2>" + paivamaarat[i].toLocaleDateString() + "</h2><hr />");
              if (tapahtumat.length == 0)
                tulokset.append("<h3 class=\"eiosumia\">Ei osumia</h3>");
              var tulos = "";
              osumamaara += tapahtumat.length;
              $.each(tapahtumat, function(jarjestys, tapahtumatiedot) {
                tulokset.append("<div id=\"" + tapahtumatiedot.item_id + "\"></div>");
                var uusi = $("#tulokset #" + tapahtumatiedot.item_id);
                uusi.html(tiedot.html());
                uusi.find(".otsikko").html(tapahtumatiedot.title);
                uusi.find(".kuva").attr("src", tapahtumatiedot.image.src);
                var paikka = tapahtumatiedot.contact_info;
                uusi.find(".paikka").html(paikka.address + ", " + paikka.city);
                uusi.find(".kartalla").on("click", function() {
                    sijainti.attr("data-osoite", paikka.address);
                });

                uusi.find(".kuvaus").html(tapahtumatiedot.description);
                uusi.find(".linkki").html("<a href=\"" + paikka.link + "\">" + paikka.link + "</a>");
                if (tapahtumatiedot.single_datetime) {
                  uusi.find(".aika").html("Tapahtuman alkamisajankohta:");
                  var esiintymisaika = new Date(tapahtumatiedot.start_datetime);
                  uusi.find(".ajat").append(esiintymisaika.toLocaleString());
                } else {
                  if (tapahtumatiedot.times.length > 3)
                    tapahtumatiedot.times = tapahtumatiedot.times.splice(0, 3);
                  uusi.find(".aika").html("Seuraavat " + tapahtumatiedot.times.length + " tapahtuma-aikaa:");
                  $.each(tapahtumatiedot.times, function(aikanumero, aikatiedot) {
                    var esiintymisaika = new Date(tapahtumatiedot.times[aikanumero].start_datetime);
                    uusi.find(".ajat").append("<li>" + esiintymisaika.toLocaleString() + "</li>");
                  });
                }
                uusi.find(".lisatiedot").hide();
                uusi.find(".lisatietopainike").on("click", function() {
                    if ($(this).parent().siblings(".lisatiedot").is(":visible"))
                        $(this).parent().siblings(".lisatiedot").slideUp();
                    else
                        $(this).parent().siblings(".lisatiedot").slideDown();
                });
                uusi.find(".suosikit").on("click", function() {
                    if (localStorage.getItem(tapahtumatiedot.item_id) == null)
                        localStorage.setItem(tapahtumatiedot.item_id, uusi.html());
                    else
                        localStorage.removeItem(tapahtumatiedot.item_id);
                });
              });
              if (i == paivamaarat.length - 1)
                osumat.html(osumamaara + " osumaa");
            });
        })(avain);
      }
  });



  suodata.trigger("click");
  $(window).trigger("resize");
});
