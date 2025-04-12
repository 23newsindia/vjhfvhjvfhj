<?php
/*
Plugin Name: Advanced Banner Carousel
Description: Create beautiful banner carousels like The Souled Store with multiple slides
Version: 1.0
Author: Your Name
*/

if (!defined('ABSPATH')) {
    exit;
}

// Define constants
define('ABC_VERSION', '1.0');
define('ABC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ABC_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include necessary files
require_once ABC_PLUGIN_DIR . 'includes/class-abc-admin.php';
require_once ABC_PLUGIN_DIR . 'includes/class-abc-frontend.php';
require_once ABC_PLUGIN_DIR . 'includes/class-abc-db.php';

// Initialize the plugin
function abc_init() {
    // First check if tables exist and create them if not
    ABC_DB::check_tables();
    
    // Initialize admin interface
    if (is_admin()) {
        new ABC_Admin();
    }
    
    // Initialize frontend
    new ABC_Frontend();
}
add_action('plugins_loaded', 'abc_init');

// Register activation hook
register_activation_hook(__FILE__, array('ABC_DB', 'create_tables'));

// Add uninstall hook
register_uninstall_hook(__FILE__, array('ABC_DB', 'delete_tables'));