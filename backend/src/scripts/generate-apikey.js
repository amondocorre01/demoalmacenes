require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const crypto = require('crypto');
const { query } = require('../config/database');

async function crearApiKey(nombreSistema, descripcion, permisos, diasExpiracion) {
    const apiKey = 'nkn_' + crypto.randomBytes(32).toString('hex');
    const permisosJson = JSON.stringify(permisos || ['notify:send']);

    const result = await query(`
        EXEC SP_NOTIFICACION_API_KEY_CREAR
            @apiKey, @nombreSistema, @descripcion, @permisos, @diasExpiracion
    `, [
        { name: 'apiKey', value: apiKey },
        { name: 'nombreSistema', value: nombreSistema },
        { name: 'descripcion', value: descripcion || null },
        { name: 'permisos', value: permisosJson },
        { name: 'diasExpiracion', value: diasExpiracion || null }
    ], 'planta');

    const id = result.recordset[0]?.id;
    console.log('\n========================================');
    console.log('  API Key generada correctamente');
    console.log('========================================');
    console.log(`  ID:       ${id}`);
    console.log(`  Sistema:  ${nombreSistema}`);
    console.log(`  API Key:  ${apiKey}`);
    console.log(`  Permisos: ${permisosJson}`);
    console.log(`  Expira:   ${diasExpiracion ? diasExpiracion + ' días' : 'Nunca'}`);
    console.log('========================================');
    console.log('\nGuarda esta API Key. No se mostrará nuevamente.\n');

    return { id, apiKey };
}

const args = process.argv.slice(2);
const nombreSistema = args[0];
const descripcion = args[1];
const permisos = args[2] ? args[2].split(',') : ['notify:send'];
const diasExpiracion = args[3] ? parseInt(args[3]) : null;

if (!nombreSistema) {
    console.log('\nUso: node generate-apikey.js <nombre_sistema> [descripcion] [permisos] [dias_expiracion]');
    console.log('Ejemplo: node generate-apikey.js sistema-empresa "Sistema de gestión empresarial" "notify:send,notify:broadcast" 365\n');
    process.exit(1);
}

crearApiKey(nombreSistema, descripcion, permisos, diasExpiracion)
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
