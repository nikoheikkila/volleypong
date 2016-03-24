## _Volleypong_ (lentopongi)

[**Lähdekoodit**](https://github.com/nikoheikkila/volleypong)  
[**Demo**](http://nikoheikkila.com/misc/projects/volleypong)

![Kuvakaappaus: Volleypong](https://tim.jyu.fi/images/115054/volleypong.png)

### Raportti

Syklin ensimmäistä prototyyppiä varten toteutin Pong-kloonin JavaScriptin THREE.js -kirjaston avulla. Kyseessä olevaan kirjastoon olen tutustunut aiemmin tietokonegrafiikan perusteita käsittelevän kurssin lomassa, joten päätin tutustua tarkemmin, miten itse peliohjelmointi onnistuu sillä.

Varsinaisen pelimoottorin sijasta Three.js on enemmänkin WebGL-tekniikkaa tukeva grafiikkakirjasto, jolloin varsinaiset pelimekaniikat on ohjelmoitava itse. Tämä tuotti jonkin verran työtä, mutta kirjaston suosion ansiosta sille on saatavissa runsaasti erilaisia ohjeita ja vinkkejä.

Pelissä käytin selaimessa ajettavaa WebGL-liitännäistä, joka alustetaan seuraavasti.

```javascript
renderer = new THREE.WebGLRenderer({ alpha: true });
```

Nyt muuttujan `renderer` avulla voidaan luoda HTML5:n `<canvas>` -elementti, johon itse peli piirretään. Peli tarvitsee myös kameran, johon asetin kolmiulotteisen perspektiivin.

```javascript
camera = new THREE.PerspectiveCamera(cfg.view_angle, aspect, cfg.near, cfg.far);
camera.position.set(0, 250, cfg.field.length / 2 + 600);
```

Olion konstruktorille annettavat parametrit tulevat muuttujasta `cfg`, joka on pelin määrittelevää dataa sisällään pitävä JSON-objekti. `aspect` on kuvasuhde, joka saadaan jakamalla selainikkunan leveys sen pituudella. Lopuksi kamera täytyy asettaa oikeaan kohtaan.

Pelin keskeisimmät komponentit kenttä ja pallo mallinnettiin peleihin omina luokkina. Graafisesti kenttä esitettiin latistettuna kuutiona, jonka mitat muokattiin lattiaa muistuttavaksi. Pallolle on oma graafinen esitystapansa. Valmiimmassa versiossa myös pelaajien mailat tulisi refaktoroida omiksi luokikseen, jolloin tällä hetkellä hyvin yksinkertainen ja buginen tekoäly saataisiin myös vähällä vaivalla hiottua kuntoon.

Tekoälyrutiini hoidetaan metodissa `processCPUPaddle()`, joka liikuttaa vastustajan mailaa kohti palloa aina sen ollessa tietyn etäisyyden päässä. Koska tekoäly on niin yksinkertainen, on se myös helppo voittaa.

Peli tarvitsi vielä kevyen valaistuksen, joka hoidettiin näin.

```javascript
mainLight = new THREE.HemisphereLight(getRandomColor(), getRandomColor());
```

Erikoisuutena loin metodin `getRandomColor()`, joka palauttaa satunnaisen värin heksadesimaaliarvon. Kunnollisten tekstuurien puutteessa päädyin värittämään elementit satunnaisesti pelin alussa, mikä hieman kohensi pelin vaatimatonta ilmettä.

```javascript
let getRandomColor = function color() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
};
```

Äänitehosteena on yksinkertainen pallonlyöntitehoste, joka soitetaan HTML5:n `<audio>` -elementin avulla aina, kun metodia `hitBallBack()` kutsutaan.

### Lähteet

- [THREE.js -kirjasto](http://threejs.org/)
