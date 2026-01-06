/***********************
 * script.js
 *
 *  - Delayed text animations (animateEntry)
 *  - Hamburger menu open/close
 *  - Night mode toggle
 *  - Intersection Observer (for fadeInUp)
 ***********************/

function addAnimationDelays(array, ms) {
    for (let i = 0; i < array.length; i++) {
      $(array[i]).css("transition-delay", (ms * i) + 'ms');
    }
  }
  
  function animateEntry() {
    addAnimationDelays($(".animateEntry"), 100);
    $('.animateEntry').css("top", "0");
    $('.animateEntry').css("opacity", "1");
  }
  
  // ========== ON PAGE LOAD ==========
  $(window).on('load', function() {
    animateEntry();
  });
  
  $(document).ready(function() {
    // Smooth scrolling to anchors
    $('a[href*="#"]:not([href="#"])').click(function() {
      if (
        location.pathname.replace(/^\//,'') === this.pathname.replace(/^\//,'') &&
        location.hostname === this.hostname
      ) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
        if (target.length) {
          $('html, body').animate({ scrollTop: target.offset().top }, 1000);
          return false;
        }
      }
    });
  
    // ---------- Hamburger menu animations ----------
    var menuLines = $(".mline");
    var closeLines = $(".xline");
    addAnimationDelays(menuLines, 75);
    addAnimationDelays(closeLines, 100);
  
    var menuIsOpen = false;
    var menuIsOpening = false;
  
    menuLines[2].addEventListener('transitionend', function() {
      if (menuIsOpening) {
        showXLines();
        menuIsOpen = true;
      }
    });
    closeLines[1].addEventListener('transitionend', function() {
      if (!menuIsOpening) {
        showMenuLines();
        menuIsOpen = false;
      }
    });
  
    $('#hamburgerOpen').click(function() {
      if (!menuIsOpen) {
        menuIsOpening = true;
        hideMenuLines();
        openMenu();
      } else {
        menuIsOpening = false;
        hideXLines();
        closeMenu();
      }
    });
  
    $('.menuOption').click(function() {
      menuIsOpening = false;
      hideXLines();
      closeMenu();
    });
  
    function hideMenuLines() {
      for (let i=0;i<menuLines.length;i++){
        menuLines[i].classList.add('toggleOpen');
      }
    }
    function showMenuLines() {
      for (let i=0;i<menuLines.length;i++){
        menuLines[i].classList.remove('toggleOpen');
      }
    }
    function hideXLines() {
      for (let i=0;i<closeLines.length;i++){
        closeLines[i].classList.remove('toggleClose');
      }
    }
    function showXLines() {
      for (let i=0;i<closeLines.length;i++){
        closeLines[i].classList.add('toggleClose');
      }
    }
    function openMenu() {
      $("#mainMenu").addClass("mainMenuOpen");
    }
    function closeMenu() {
      $("#mainMenu").removeClass("mainMenuOpen");
    }
  
    // ---------- Scroll-based color changes ----------
    $(document).on('scroll', function() {
      checkSectionChange();
      changeHamburgerColor();
      changeVIndicatorColor();
      changeNightModeToggleColor();
    });
  
    function changeNightModeToggleColor() {
      if ($('#night-mode-icon').offset().top >= $('#changeNavColor').position().top - 10) {
        $('#night-mode-icon').removeClass('whiteSVGFill');
        $('#night-mode-icon').addClass('darkSVGFill');
      } else {
        $('#night-mode-icon').addClass('whiteSVGFill');
        $('#night-mode-icon').removeClass('darkSVGFill');
      }
    }
  
    function changeHamburgerColor() {
      if ($(this).scrollTop() >= $('#changeNavColor').position().top - 40) {
        $('.mline').removeClass('whiteBackground');
        $('.mline').addClass('darkBackground');
      } else {
        $('.mline').removeClass('darkBackground');
        $('.mline').addClass('whiteBackground');
      }
    }
  
    function changeVIndicatorColor() {
      if ($('#vSectionIndicator').offset().top >= $('#changeNavColor').position().top - 40) {
        $('#vSectionIndicator').removeClass('whiteText');
        $('#vSectionIndicator').addClass('darkText');
      } else {
        $('#vSectionIndicator').addClass('whiteText');
        $('#vSectionIndicator').removeClass('darkText');
      }
    }
  
    // ---------- Section indicator logic ----------
    var lastSection;
    function findSection() {
      let sections = document.getElementsByClassName('switch');
      for (let i = sections.length - 1; i >= 0; i--) {
        if ($(document).scrollTop() >= $(sections[i]).position().top - ($(window).height() / 2)) {
          return $(sections[i]).data('id');
        }
      }
    }
    function checkSectionChange() {
      let curSection = findSection();
      if (lastSection !== curSection) {
        lastSection = curSection;
        $('#vSectionIndicator').fadeOut(250, function() {
          $(this).text(curSection).fadeIn(250);
        });
      }
    }
  
    // ---------- Projects count ----------
    var projectCounters = $('.project-counter');
    for (let i = 0; i < projectCounters.length; i++) {
      projectCounters[i].innerHTML = (i + 1) + "/" + projectCounters.length;
    }
  
    // ---------- Night Mode logic ----------
    var d = new Date();
    var sunIcon = '<path d="M8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-1c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM7.5 0h1v3h-1zM7.5 13h1v3h-1zM13.303 1.99l.707.707-2.12 2.12-.708-.706zM4.11 11.182l.708.707-2.12 2.12-.708-.707zM16 7.5v1h-3v-1zM3 7.5v1H0v-1zM14.01 13.303l-.706.707-2.122-2.12.707-.708zM4.818 4.11l-.707.708-2.12-2.12.706-.708z"/>';
    var moonIcon = '<path d="M6.103.226C5.405 1.316 5 2.61 5 4c0 3.866 3.134 7 7 7 1.39 0 2.685-.405 3.774-1.103C14.922 13.4 11.764 16 8 16c-4.418 0-8-3.582-8-8C0 4.235 2.6 1.078 6.103.226zM4.226 2.103C2.286 3.348 1 5.523 1 8c0 3.866 3.134 7 7 7 2.476 0 4.652-1.286 5.897-3.226-.608.148-1.244.226-1.897.226-4.418 0-8-3.582-8-8 0-.653.078-1.29.226-1.897z"/>';
  
    var nightMode = false;
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // If user’s system is in dark mode OR it’s late at night, default to dark
    if (isDarkMode || (d.getHours() >= 20 || d.getHours() <= 4)) {
      toggleNightMode();
      $('#night-mode-icon').html(sunIcon);
    } else {
      $('#night-mode-icon').html(moonIcon);
    }
  
    function toggleNightMode() {
      if (!nightMode) {
        // Turn dark
        $('#night-mode-icon').html(sunIcon);
        changeCss('body', 'background-color: #161616;');
        changeCss('.darkText', 'color: white;');
        changeCss('.darkBackground', 'background-color: white;');
        changeCss('.readingText', 'color: #CBCBCB;');
        changeCss('#landing', 'border-color: #161616;');
        changeCss('.mainColorBackground-blur', 'background-color: rgba(0,0,0,0.5);');
        changeCss('#mainMenu .menu-options a::after', 'background: white;');
        changeCss('.addAnimatedUnderline::after', 'background: white;');
        $('.addBlur').addClass('darkBlur');
        nightMode = true;
      } else {
        // Turn light
        $('#night-mode-icon').html(moonIcon);
        $('#css-modifier-container').remove();
        $('.addBlur').removeClass('darkBlur');
        nightMode = false;
      }
    }
  
    function changeCss(className, classValue) {
      // We use an invisible container to store extra CSS definitions
      var cssMainContainer = $('#css-modifier-container');
      if (cssMainContainer.length === 0) {
        cssMainContainer = $('<div id="css-modifier-container"></div>');
        cssMainContainer.hide();
        cssMainContainer.appendTo($('body'));
      }
      // One div per custom rule
      let classContainer = cssMainContainer.find('div[data-class="' + className + '"]');
      if (classContainer.length === 0) {
        classContainer = $('<div data-class="' + className + '"></div>');
        classContainer.appendTo(cssMainContainer);
      }
      classContainer.html('<style>' + className + ' {' + classValue + '}</style>');
    }
  
    $('#night-mode-toggle').click(function() {
      toggleNightMode();
    });
  
    // Set the year in footer
    $("#year").text(d.getFullYear());
  
    // ---------- Intersection Observer for fadeInUp ----------
    const faders = document.querySelectorAll('.fadeInUp');
    const appearOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    };
    const appearOnScroll = new IntersectionObserver(function(
      entries,
      appearOnScroll
    ) {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('inView');
        appearOnScroll.unobserve(entry.target);
      });
    }, appearOptions);
  
    faders.forEach(fader => {
      appearOnScroll.observe(fader);
    });

    // ---------- Section heading fade when content is in view ----------
    const sectionHeadings = document.querySelectorAll('.stickySectionIndicator-heading');
    const sectionContents = document.querySelectorAll('.building-list, .project-list, .publication-list, .row');

    const headingFadeObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        // Find the closest section heading
        const section = entry.target.closest('.section-withStickyIndicator');
        if (section) {
          const heading = section.querySelector('.stickySectionIndicator-heading');
          if (heading) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
              heading.classList.add('faded');
            } else {
              heading.classList.remove('faded');
            }
          }
        }
      });
    }, { threshold: [0, 0.1, 0.5] });

    sectionContents.forEach(content => {
      headingFadeObserver.observe(content);
    });

    // ---------- Horizontal scroll buttons ----------
    $('.scroll-btn-left').click(function() {
      const scrollList = $(this).siblings('.project-list, .building-list');
      scrollList.animate({ scrollLeft: scrollList.scrollLeft() - 400 }, 300);
    });

    $('.scroll-btn-right').click(function() {
      const scrollList = $(this).siblings('.project-list, .building-list');
      scrollList.animate({ scrollLeft: scrollList.scrollLeft() + 400 }, 300);
    });

    // Hide scroll hint after user scrolls
    $('.project-list, .building-list').on('scroll', function() {
      $(this).siblings('.scroll-hint').addClass('hidden');
    });
  });
  