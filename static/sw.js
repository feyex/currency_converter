/*declare the cache name*/
const CACHE_NAME = "V1"

/**
 * The install event is fired when the registration succeeds.
 * After the install step, the browser tries to activate the service worker.
 * Generally, we cache static resources that allow the website to run offline
 */
this.addEventListener('install', async () => {
  const cache = await caches.open(CACHE_NAME);
  cache.addAll([
    '../',
    '../static/fcv.js',
    '../static/idb.js',
    '../static/style.css',
    '../static/vendor/bootstrap/css/bootstrap.min.css',
    '../static/vendor/fontawesome/web-fonts-with-css/css/fontawesome.min.css'
  ]).then(() => {
    console.log('WORKER: install completed');
  })
});


/**
 * The fetch event is fired every time the browser sends a request. 
 * In this case, the service worker acts as a proxy. We can for example return the cached
 * version of the ressource matching the request, or send the request to the internet
 * , we can even make our own response from scratch !
 * Here, we are going to use cache first strategy
 */
self.addEventListener('fetch', (event) => {

  //We defind the promise (the async code block) that return either the cached response or the network one
  //It should return a response object

  console.log('WORKER: fetch event in progress.');

  /* We should only cache GET requests, and deal with the rest of method in the
     client-side, by handling failed POST,PUT,PATCH,etc. requests.
  */
  if (event.request.method !== 'GET') {
    /* If we don't block the event as shown below, then the request will go to
       the network as usual.
    */
    console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
    return;
  }

  const getCustomResponsePromise = async () => {

    console.log(`URL ${event.request.url}`, `location origin ${location}`);

    try {
      //Try to get the cached response
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        //Return the cached response if present
        console.log(`Cached response ${cachedResponse}`)
        return cachedResponse
      }

      //Get the network response if no cached response is present
      const netResponse = await fetch(event.request)
      console.log(`adding net response to cache`)

      //Here, we add the network response to the cache
      let cache = await caches.open(CACHE_NAME)

      //We must provide a clone of the response here
      cache.put(event.request, netResponse.clone())

      //return the network response
      return netResponse
    } catch (err) {
      console.error(`Error ${err}`)
      throw err
    }
  }

  //In order to override the default fetch behavior, we must provide the result of our custom behavoir to the
  //event.respondWith method
  event.respondWith(getCustomResponsePromise())
});

self.addEventListener('activate', async (event) => {

  await caches.keys()
    .then((keys) => {
      return Promise.all(keys.map(function (key, i) {
        if (key !== CACHE_NAME) {
          return caches.delete(keys[i]);
        }
      }))
    })
});