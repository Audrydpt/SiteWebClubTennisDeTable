<?php

require 'vendor/autoload.php';

use Yoerioptr\TabtApiClient\Client\Client;
use Yoerioptr\TabtApiClient\Entries\CredentialsType;
use Yoerioptr\TabtApiClient\Tabt;

// Instanciation du client
$client = new Client();
$credentials = new CredentialsType('username', 'password');
$client->setCredentials($credentials);

// TabT API client
$tabt = new Tabt($client);

// Test de la connexion
$testResponse = $tabt->test()->info();

echo "✅ Connexion réussie !\n";
echo "API Version: " . $testResponse->getApiVersion() . "\n";
echo "Base de données: " . $testResponse->getDatabase() . "\n";
echo "Compte valide: " . ($testResponse->isValidAccount() ? 'Oui' : 'Non') . "\n";
echo "Langue: " . $testResponse->getLanguage() . "\n";
echo "Timestamp serveur: " . $testResponse->getTimestamp()->format('Y-m-d H:i:s') . "\n";
