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

// Sirve la página de inicio de sesión
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

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

// Manejo de errores en el servidor
server.on('error', function (error) {
    console.error("Error starting server:", error);
});