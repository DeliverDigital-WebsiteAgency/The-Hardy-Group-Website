<?php
/**
 * Plugin Name: Hardy Group Headless
 * Description: Runs cms.thehardygroup.org as a headless CMS. Sends visitors to the Node front end, points "View Post" links there, and clears the front end's cache when posts change.
 * Version:     1.0.0
 *
 * Install: copy this file to wp-content/mu-plugins/ (create the folder if needed).
 * Configure in wp-config.php:
 *   define( 'THG_FRONTEND_URL', 'https://thehardygroup.org' );
 *   define( 'THG_REVALIDATE_SECRET', 'same value as REVALIDATE_SECRET on the Node app' );
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function thg_frontend_url( $path = '' ) {
	$base = defined( 'THG_FRONTEND_URL' ) ? THG_FRONTEND_URL : 'https://thehardygroup.org';
	return untrailingslashit( $base ) . $path;
}

/**
 * Point permalinks at the Node site so "View Post" in the editor opens the live page.
 */
add_filter( 'post_link', function ( $url, $post ) {
	return thg_frontend_url( '/blog/' . $post->post_name );
}, 10, 2 );

add_filter( 'author_link', function ( $url, $author_id, $author_nicename ) {
	return thg_frontend_url( '/blog/author/' . $author_nicename );
}, 10, 3 );

/**
 * Nobody should browse the WordPress theme. Send front-end visits to the Node site.
 * Leaves wp-admin, login, REST API, cron, and previews alone.
 */
add_action( 'template_redirect', function () {
	if ( is_preview() || is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( is_singular( 'post' ) ) {
		$target = thg_frontend_url( '/blog/' . get_post_field( 'post_name', get_queried_object_id() ) );
	} elseif ( is_author() ) {
		$target = thg_frontend_url( '/blog/author/' . get_queried_object()->user_nicename );
	} elseif ( is_home() || is_archive() ) {
		$target = thg_frontend_url( '/blog' );
	} else {
		$target = thg_frontend_url( '/' );
	}
	wp_redirect( $target, 301 );
	exit;
} );

/**
 * When a post is published, updated, unpublished, or trashed, tell the Node site
 * to clear its cache so the change shows up right away.
 */
function thg_revalidate_frontend() {
	if ( ! defined( 'THG_REVALIDATE_SECRET' ) || ! THG_REVALIDATE_SECRET ) {
		return;
	}
	wp_remote_post( thg_frontend_url( '/api/revalidate' ), array(
		'blocking' => false,
		'timeout'  => 3,
		'headers'  => array( 'X-Revalidate-Secret' => THG_REVALIDATE_SECRET ),
	) );
}

add_action( 'transition_post_status', function ( $new_status, $old_status, $post ) {
	if ( 'post' !== $post->post_type ) {
		return;
	}
	if ( 'publish' === $new_status || 'publish' === $old_status ) {
		thg_revalidate_frontend();
	}
}, 10, 3 );

// Author name, bio, or avatar changes also affect the public site.
add_action( 'profile_update', 'thg_revalidate_frontend' );

/**
 * Posts are the only managed content. Hide the parts of wp-admin that don't apply.
 */
add_action( 'admin_menu', function () {
	remove_menu_page( 'edit-comments.php' );
	remove_menu_page( 'themes.php' );
} );

add_filter( 'comments_open', '__return_false' );
