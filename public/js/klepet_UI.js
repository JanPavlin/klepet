function youtube(vhodnoBesedilo){
  var tab = vhodnoBesedilo.split(" ");
  
  for (var i = 0; i < tab.length; i++){
    if(tab[i].substring(0,32) === "https://www.youtube.com/watch?v=") {
      var idVideo = tab[i].substring(32,tab[i].length);
      $('#sporocila').append('<iframe src="https://www.youtube.com/embed/'+ idVideo+'" style="width: 200px; height: 150px; margin-left: 20px" allowfullscreen></iframe>');
    }
    
  }
  
  
  
  
}

function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
 var jeDinamicno = false;
 var jeYoutube = sporocilo.indexOf('<iframe') > -1;
 
 var jeSlika = sporocilo.indexOf('<img ') > -1;
 
  jeDinamicno |= sporocilo.indexOf( '<img' ) > -1;
  
  if (jeSmesko||jeSlika) {
     sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
   sporocilo = sporocilo.replace(/&lt;img/g, '<img').replace(/jpg' \/&gt;/g, "jpg ' />").replace(/gif' \/&gt;/g, "gif ' />").replace(/png' \/&gt;/g, "png' />"); 
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}
function dodajSlike( vhod )
{
        var regex         = new RegExp('\\bhttps?://[a-z%\\-_0-9/:\\.]*\\.(png|gif|jpg)\\b', 'gi');
       
        var private       = vhod.startsWith("/private");
        var seznam = [];
        var ujem         = null;
        if ( private )
                vhod = vhod.substr( 0, vhod.lastIndexOf( '"' ) );

        while ( ( ujem = regex.exec( vhod ) ) !== null )
                seznam.push( ujem[ 0 ] );
        
        for ( var i = 0; i < seznam.length; ++i )
                vhod += '<img width=\'200\' style=\'margin-left:20px; display:block\' src=\'' + seznam[ i ] + '\' />';

        if ( private )
                vhod += '"';
                
        return vhod;
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajSlike(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    youtube(sporocilo);
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  $('#vsebina').jrumble();
  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    youtube(sporocilo.besedilo);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });
  function dodajSlike(vhodnoBesedilo){
  var exp = vhodnoBesedilo.match(new RegExp("https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg)", "gi"));
  var dodaj = '';
 if (exp != null) {
    for(x in exp){
      dodaj +=  " <img id = 'slika' src = '" +exp[x]+ "' />";
    }
  }
  vhodnoBesedilo += dodaj;
  return vhodnoBesedilo;
} 

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
  });

  $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val('/zasebno "' + $(this).text() + '"');
      $('#poslji-sporocilo').focus();
    });

  socket.on('dregljaj', function(){
  $('#vsebina').trigger('startRumble');
  setTimeout(function()  {  $('#vsebina').trigger('stopRumble');  }, 1500);});


  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
