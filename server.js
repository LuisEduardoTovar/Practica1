// Importa los módulos necesarios
var express = require('express');
var bodyParser = require('body-parser');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, update, remove } = require('firebase/database');
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");

var app = express();
app.use(bodyParser.json()); // Necesario para parsear el cuerpo de las peticiones HTTP
// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));
app.use(express.static('public2'));

//----------------------------------------------------------FIREBASE----------------------------------------------------------------------
// Configuración de Firebase
var config = {
	apiKey: "AIzaSyBobT87pK4JNntF6825Vp4MBhJANcVAClw",
    authDomain: "proyecto-15-439520.firebaseapp.com",
    databaseURL: "https://proyecto-15-439520-default-rtdb.firebaseio.com",
    projectId: "proyecto-15-439520",
    storageBucket: "proyecto-15-439520.appspot.com",
    messagingSenderId: "736378041434",
    appId: "1:736378041434:web:b856934652bf30b3869463",
    measurementId: "G-DJT60EER74"
};

// Inicializa la aplicación de Firebase
const firebaseApp = initializeApp(config);
const database = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);

//----------------------------------------------------------PAGINA----------------------------------------------------------------------
// Sirve la página de inicio de sesión
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public2/drive.html');
});

//----------------------------------------------------------CREACION DE USUARIOS----------------------------------------------------------------------
// Create new instance
app.put('/', function (req, res) {
    console.log("HTTP Put Request");

    var userName = req.body.UserName;
    var name = req.body.Name;
    var age = req.body.Age;

    var referencePath = '/Users/' + userName + '/';
    const userReference = ref(database, referencePath);
    
    set(userReference, { Name: name, Age: age })
        .then(() => {
            res.send("Data saved successfully.");
        })
        .catch((error) => {
            res.send("Data could not be saved." + error);
        });
});

// Update existing instance
app.post('/', function (req, res) {
    console.log("HTTP POST Request");

    var userName = req.body.UserName;
    var name = req.body.Name;
    var age = req.body.Age;

    var referencePath = '/Users/' + userName + '/';
    const userReference = ref(database, referencePath);
    
    update(userReference, { Name: name, Age: age })
        .then(() => {
            res.send("Data updated successfully.");
        })
        .catch((error) => {
            res.send("Data could not be updated." + error);
        });
});

//----------------------------------------------------------SERVER----------------------------------------------------------------------
// Inicia el servidor
var PORT = 8080;
var server = app.listen(PORT, function () {
    console.log(`Server is listening on port ${PORT}`);
    
    var address = server.address();
    if (address) {
        var host = address.address || 'localhost';
        var port = address.port;
        console.log("Example app listening at http://%s:%s", host, port);
    } else {
        console.error("Server address is not available.");
    }
});

//----------------------------------------------------------INICIO DE SESION----------------------------------------------------------------------
// Endpoint para el inicio de sesión
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            res.send({ message: "Inicio de sesión exitoso", user: user.uid });
        })
        .catch((error) => {
            res.status(401).send({ error: "Error en el inicio de sesión: " + error.message });
        });
});

const { createUserWithEmailAndPassword } = require("firebase/auth");

// Endpoint para registro de usuarios
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            res.send({ message: "Registro exitoso", user: user.uid });
        })
        .catch((error) => {
            res.status(400).send({ error: "Error en el registro: " + error.message });
        });
});

//----------------------------------------------------------PRODUCTOS----------------------------------------------------------------------
// Ruta GET para obtener todos los productos
app.get('/productos', (req, res) => {
    const productsRef = ref(database, '/Productos/');
    get(productsRef).then((snapshot) => {
        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.send("No hay productos disponibles");
        }
    }).catch((error) => {
        res.status(500).send("Error al obtener productos: " + error);
    });
});

// Alta de producto
app.post('/productos', (req, res) => {
    const { id, precio, cantidad, descripcion } = req.body;
    const productRef = ref(database, `/Productos/${id}`);
    set(productRef, { precio, cantidad, descripcion })
        .then(() => res.send("Producto agregado con éxito"))
        .catch((error) => res.status(500).send("Error al agregar producto: " + error));
});

app.delete('/productos/:id', (req, res) => {
    const productId = req.params.id;
    const productRef = ref(database, `/Productos/${productId}`);
    
    // Verificar si el producto existe
    get(productRef).then(snapshot => {
        if (!snapshot.exists()) {
            return res.status(404).send("Producto no encontrado");
        }

        // Si el producto existe, eliminarlo
        remove(productRef)
            .then(() => {
                console.log(`Producto con ID ${productId} eliminado`);
                res.send("Producto eliminado con éxito");
            })
            .catch((error) => {
                console.error("Error al eliminar el producto:", error);
                res.status(500).send("Error al eliminar producto");
            });
    }).catch((error) => {
        console.error("Error al verificar existencia del producto:", error);
        res.status(500).send("Error al verificar el producto");
    });
});


//----------------------------------------------------------ERRORES----------------------------------------------------------------------
// Manejo de errores en el servidor
server.on('error', function (error) {
    console.error("Error starting server:", error);
});

//----------------------------------------------------------GOOGLE DRIVE API---------------------------------------------------------------------

const { google } = require('googleapis');
const fs = require('fs');

// Configura el OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    '736378041434-q729pnvu58vnidcmtnf6oj73nonniu4q.apps.googleusercontent.com',
    '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',
    'https://8080-cs-310508937389-default.cs-us-west1-wolo.cloudshell.dev/oauth2callback' // URI actualizada
  );

// Ruta para iniciar la autenticación
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
  });
  res.redirect(authUrl);
});

// Callback después de la autenticación
app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
  
    try {
      // Obtén los tokens usando el código de autorización
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens); // Establece el token en el cliente OAuth2
  
      // Almacena los tokens si es necesario (en una base de datos o sesión)
      res.send('Autenticación exitosa. Ahora puedes cargar archivos y ver las carpetas.');
    } catch (error) {
      console.error('Error al obtener el token:', error);
      res.status(500).send('Error en la autenticación');
    }
  });

//----------------------------------------------------------GOOGLE DRIVE API GESTION DE ARCHIVOS----------------------------------------------------------

const drive = google.drive({ version: 'v3', auth: oAuth2Client });
const multer = require('multer'); // Instala el paquete 'multer': npm install multer
const upload = multer({ dest: 'uploads/' }).single('file'); // Configura multer para guardar archivos temporalmente en la carpeta 'uploads/'

app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(500).send(err);
      } else if (err) {
        return res.status(500).send(err);
      }
  
      // req.file contiene información sobre el archivo subido (incluyendo su path temporal)
      const filePath = req.file.path; 
      const fileName = req.file.originalname;
      const fileMimeType = req.file.mimetype;
  
  
      const fileMetadata = {
        name: fileName,
        parents: ['1IHCya6x9tqfhmW2Gk2ultIskmcR7-fUP'] // Reemplaza 'folderId' con el ID de la carpeta de Google Drive donde quieres subirlo (opcional)
      };
      const media = {
        mimeType: fileMimeType,
        body: fs.createReadStream(filePath)
      };
  
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, (err, file) => {
        if (err) {
          console.error("Error subiendo archivo a Google Drive:", err);
          fs.unlink(filePath, () => {}); // Elimina el archivo temporal si hay error
          return res.status(500).send('Error al subir el archivo: ' + err);
        } else {
          // Después de subir correctamente, elimina el archivo temporal:
          fs.unlink(filePath, (err) => {
            if(err){ console.error("Error eliminando archivo temporal", err); }
          });
          res.send('Archivo subido con ID: ' + file.data.id);
        }
      });
    });
  });

  app.get('/list-files', async (req, res) => {
    try {
      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      
      // Solicitar archivos y carpetas de la raíz del Drive
      const response = await drive.files.list({
        pageSize: 20, // Número máximo de archivos a listar
        fields: 'files(id, name, mimeType, parents)',
      });
      
      const files = response.data.files;
      
      if (files.length === 0) {
        res.send('No se encontraron archivos o carpetas.');
      } else {
        res.json(files); // Devuelve los archivos en formato JSON
      }
    } catch (error) {
      console.error('Error al listar archivos:', error);
      res.status(500).send('Error al listar archivos.');
    }
  });

  app.delete('/delete-file/:id', async (req, res) => {
    const fileId = req.params.id; // Captura el ID del archivo desde la URL
  
    try {
      await drive.files.delete({ fileId }); // Llama a la API para eliminar el archivo
      res.send(`Archivo con ID ${fileId} eliminado con éxito.`);
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      res.status(500).send('Error al eliminar el archivo.');
    }
  });

  app.post('/create-folder', async (req, res) => {
    const { folderName, parentId } = req.body;
  
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []  // Asigna una carpeta padre si se especifica
      };
  
      const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });
  
      res.send(`Carpeta creada con ID: ${folder.data.id}`);
    } catch (error) {
      console.error('Error al crear carpeta:', error);
      res.status(500).send('Error al crear carpeta.');
    }
  });

  app.get('/download/:fileId/:fileName', async (req, res) => {
    const { fileId, fileName } = req.params;
  
    try {
      const fileStream = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'stream' });
  
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      fileStream.data.pipe(res);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      res.status(500).send('Error al descargar el archivo.');
    }
  });

  app.get('/list-folder/:folderId', async (req, res) => {
    const { folderId } = req.params;
  
    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)'
      });
      res.json(response.data.files);
    } catch (error) {
      console.error('Error al listar contenido de la carpeta:', error);
      res.status(500).send('Error al listar la carpeta.');
    }
  });

  //------------------------------------------------PRACTICA 1.3-----------------------------------------------------------------
  const path = require(`path`);

  app.get('/submit', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/form.html'));
  });

  // This middleware is available in Express v4.16.0 onwards
app.use(express.urlencoded({extended: true}));

app.post('/submit', (req, res) => {
  console.log({
    name: req.body.name,
    message: req.body.message,
  });
  res.send('Thanks for your message!');
});
