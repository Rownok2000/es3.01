import { Component, OnInit } from '@angular/core';
import { GeoFeatureCollection } from './models/geojson.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Ci_vettore} from './models/ci_vett.model';
import { Marker } from './models/marker.model';
import { MouseEvent } from '@agm/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ang-maps';
  // google maps zoom level
  zoom: number = 12;
  geoJsonObject: GeoFeatureCollection; //Oggetto che conterrà il vettore di GeoJson
  fillColor: string = "#FF0000";  //Colore delle zone catastali
  obsGeoData: Observable<GeoFeatureCollection>;
  lng: number = 9.205331366401035;
  lat: number = 45.45227445505016;
  obsCiVett : Observable<Ci_vettore[]>; //Crea un observable per ricevere i vettori energetici
  markers: Marker [];
  circleLat : number = 0; //Latitudine e longitudine iniziale del cerchio
  circleLng: number = 0;
  maxRadius: number = 400; //Voglio evitare raggi troppo grossi
  radius : number = this.maxRadius;
  serverUrl : string = "https://3000-fc2c0052-a226-4a47-9a24-f2bb17f5c2ae.ws-eu01.gitpod.io";
  constructor(public http: HttpClient) {
  }

   prepareData = (data: GeoFeatureCollection) => {
    this.geoJsonObject = data
    console.log(this.geoJsonObject);
  }

    //Metodo che riceve i dati e li aggiunge ai marker
  prepareCiVettData = (data: Ci_vettore[]) =>
  {
    let latTot = 0; //Uso queste due variabili per calcolare latitudine e longitudine media
    let lngTot = 0; //E centrare la mappa

    console.log(data);
    this.markers = [];

    for (const iterator of data) {
      let m = new Marker(iterator.WGS84_X,iterator.WGS84_Y,iterator.CI_VETTORE);
      latTot += m.lat; //Sommo tutte le latitutidini e longitudini
      lngTot += m.lng;
      this.markers.push(m);
    }
    this.lng = lngTot/data.length; //Commenta qui: qua otteniema la media tramite operazione e grazie a questo valore centriamo la mappa
    this.lat = latTot/data.length;
    this.zoom = 16;
  }

  ngOnInit() {
    //this.obsGeoData = this.http.get<GeoFeatureCollection>("https://3000-fc2c0052-a226-4a47-9a24-f2bb17f5c2ae.ws-eu01.gitpod.io/");
    //this.obsGeoData.subscribe(this.prepareData);
    //Effettua la chiamatata al server per ottenere l’elenco dei vettori energetici
  }
  cambiaFoglio(foglio) : boolean
  {
    let val = foglio.value; //Commenta qui: creiamo variabile val che assume il valore del foglio specificato nella label
    this.obsCiVett = this.http.get<Ci_vettore[]>(`${this.serverUrl}/ci_vettore/${val}`); //Commenta qui: facciamo una richiesta http.get al server
    this.obsCiVett.subscribe(this.prepareCiVettData); //Commenta qui: qui ci "sottoscriviamo e quando arrivano i dati viene lanciato il metodo prepareCiVettData"
    console.log(val);
    return false;
  }


  mapClicked($event: MouseEvent) {
    this.circleLat = $event.coords.lat; //Queste sono le coordinate cliccate
    this.circleLng = $event.coords.lng; //Sposto il centro del cerchio qui
    this.lat = this.circleLat; //Sposto il centro della mappa qui
    this.lng = this.circleLng;
    this.zoom = 15;  //Zoom sul cerchio
  }
  circleRedim(newRadius : number){
    console.log(newRadius) //posso leggere sulla console il nuovo raggio
    this.radius = newRadius;  //Ogni volta che modifico il cerchio, ne salvo il raggio
  }
  circleDoubleClicked(circleCenter)
  {
    console.log(circleCenter); //Voglio ottenere solo i valori entro questo cerchio
    console.log(this.radius);
    this.circleLat = circleCenter.coords.lat;
    this.circleLng = circleCenter.coords.lng;
    if(this.radius > this.maxRadius)
    {
      console.log("area selezionata troppo vasta sarà reimpostata a maxRadius");
      this.radius = this.maxRadius;
    }

    let raggioInGradi = (this.radius * 0.00001)/1.1132;


    const urlciVett = `${this.serverUrl}/ci_geovettore/
    ${this.circleLat}/
    ${this.circleLng}/
    ${raggioInGradi}`;

    const urlGeoGeom = `${this.serverUrl}/geogeom/
    ${this.circleLat}/
    ${this.circleLng}/
    ${raggioInGradi}`;
    //Posso riusare lo stesso observable e lo stesso metodo di gestione del metodo cambiaFoglio
    //poichè riceverò lo stesso tipo di dati
    //Divido l'url andando a capo per questioni di leggibilità non perchè sia necessario
    this.obsCiVett = this.http.get<Ci_vettore[]>(urlciVett);
    this.obsCiVett.subscribe(this.prepareCiVettData);

    this.obsGeoData = this.http.get<GeoFeatureCollection>(urlGeoGeom);
    this.obsGeoData.subscribe(this.prepareData);

    //console.log ("raggio in gradi " + (this.radius * 0.00001)/1.1132)

    //Voglio spedire al server una richiesta che mi ritorni tutte le abitazioni all'interno del cerchio

  }

  styleFunc = (feature) => {
    console.log(feature);
    return ({
      clickable: false,
      fillColor: this.avgColorMap(feature.j.media),
      strokeWeight: 1,
      fillOpacity : 1  //Fill opacity 1 = opaco (i numeri tra 0 e 1 sono le gradazioni di trasparenza)
    });
  }
    //Mappa rosso-verde
avgColorMap = (media) =>
  {
    if(media <= 36) return "#00FF00";
    if(36 < media && media <= 40) return "#33ff00";
    if(40 < media && media <= 58) return "#66ff00";
    if(58 < media && media <= 70) return "#99ff00";
    if(70 < media && media <= 84) return "#ccff00";
    if(84 < media && media <= 100) return "#FFFF00";
    if(100 < media && media <= 116) return "#FFCC00";
    if(116 < media && media <= 1032) return "#ff9900";
    if(1032 < media && media <= 1068) return "#ff6600";
    if(1068 < media && media <= 1948) return "#FF3300";
    if(1948 < media && media <= 3780) return "#FF0000";
    return "#FF0000"
  }
  //mappa scala di verdi
  avgColorMapGreen = (media) =>
  {
    if(media <= 36) return "#EBECDF";
    if(36 < media && media <= 40) return "#DADFC9";
    if(40 < media && media <= 58) return "#C5D2B4";
    if(58 < media && media <= 70) return "#ADC49F";
    if(75 < media && media <= 84) return "#93B68B";
    if(84 < media && media <= 100) return "#77A876";
    if(100 < media && media <= 116) return "#629A6C";
    if(116 < media && media <= 1032) return "#558869";
    if(1032 < media && media <= 1068) return "#487563";
    if(1068 < media && media <= 1948) return "#3B625B";
    if(1948 < media && media <= 3780) return "#2F4E4F";
    return "#003000" //Quasi nero
  }

}
