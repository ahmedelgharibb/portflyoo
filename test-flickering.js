#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Testing for Website Flickering Issues...\n');

// Test 1: Check for section reveal animations
function testSectionRevealAnimation() {
    console.log('1. Testing Section Reveal Animation...');
    const scriptPath = 'public/websites/template1/script.js';
    
    if (!fs.existsSync(scriptPath)) {
        console.log('❌ Script file not found');
        return false;
    }
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    // Check for the problematic section reveal code (excluding commented lines)
    const lines = content.split('\n');
    const hasSectionReveal = lines.some(line => {
        const trimmedLine = line.trim();
        return !trimmedLine.startsWith('//') && 
               trimmedLine.includes('opacity-0') && 
               trimmedLine.includes('translate-y-10') && 
               trimmedLine.includes('duration-700');
    });
    
    if (hasSectionReveal) {
        console.log('⚠️  WARNING: Section reveal animation found - this causes flickering!');
        console.log('   Lines containing opacity-0, translate-y-10, duration-700');
        return false;
    } else {
        console.log('✅ No section reveal animation found - good!');
        return true;
    }
}

// Test 2: Check preloader timing
function testPreloaderTiming() {
    console.log('\n2. Testing Preloader Timing...');
    const scriptPath = 'public/websites/template1/script.js';
    
    if (!fs.existsSync(scriptPath)) {
        console.log('❌ Script file not found');
        return false;
    }
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    // Check for setTimeout with 600ms or more
    const setTimeoutMatch = content.match(/setTimeout\([^)]*,\s*(\d+)\)/g);
    const longTimeouts = setTimeoutMatch?.filter(match => {
        const time = parseInt(match.match(/(\d+)/)[1]);
        return time >= 500;
    }) || [];
    
    if (longTimeouts.length > 0) {
        console.log('⚠️  WARNING: Long timeouts found that may cause flickering:');
        longTimeouts.forEach(timeout => {
            console.log(`   ${timeout}`);
        });
        return false;
    } else {
        console.log('✅ No long timeouts found - good!');
        return true;
    }
}

// Test 3: Check for theme transitions
function testThemeTransitions() {
    console.log('\n3. Testing Theme Transitions...');
    const scriptPath = 'public/websites/template1/script.js';
    
    if (!fs.existsSync(scriptPath)) {
        console.log('❌ Script file not found');
        return false;
    }
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    // Check for theme transition timeouts
    const themeTransitionMatch = content.match(/theme-transition.*setTimeout.*\d+/);
    
    if (themeTransitionMatch) {
        console.log('⚠️  WARNING: Theme transition timeout found:');
        console.log(`   ${themeTransitionMatch[0]}`);
        return false;
    } else {
        console.log('✅ No problematic theme transitions found - good!');
        return true;
    }
}

// Test 4: Check CSS for problematic animations
function testCSSAnimations() {
    console.log('\n4. Testing CSS Animations...');
    const cssPath = 'public/websites/template1/styles.css';
    
    if (!fs.existsSync(cssPath)) {
        console.log('❌ CSS file not found');
        return false;
    }
    
    const content = fs.readFileSync(cssPath, 'utf8');
    
    // Check for opacity: 0 and long transitions
    const hasOpacityZero = content.includes('opacity: 0');
    const hasLongTransitions = content.match(/transition.*\d+\.\d+s/g);
    
    if (hasOpacityZero) {
        console.log('⚠️  WARNING: CSS contains opacity: 0 - may cause flickering');
    }
    
    if (hasLongTransitions && hasLongTransitions.some(t => parseFloat(t.match(/\d+\.\d+/)[0]) > 0.5)) {
        console.log('⚠️  WARNING: Long CSS transitions found - may cause flickering');
        hasLongTransitions.forEach(t => {
            if (parseFloat(t.match(/\d+\.\d+/)[0]) > 0.5) {
                console.log(`   ${t}`);
            }
        });
        return false;
    }
    
    console.log('✅ CSS animations look good!');
    return true;
}

// Run all tests
function runAllTests() {
    const tests = [
        testSectionRevealAnimation,
        testPreloaderTiming,
        testThemeTransitions,
        testCSSAnimations
    ];
    
    const results = tests.map(test => test());
    const passedTests = results.filter(result => result === true).length;
    const totalTests = results.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Website should not flicker.');
    } else {
        console.log('⚠️  Some issues found that may cause flickering.');
        console.log('💡 Consider the fixes I applied earlier.');
    }
    
    console.log('='.repeat(50));
}

// Run the tests
runAllTests(); 