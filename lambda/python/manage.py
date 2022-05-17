#!/usr/bin/env python3
import glob
import sys
from pathlib import Path
from subprocess import call
from typing import Optional, List

import click
import pytest
from pycodestyle import StyleGuide
import pylint.lint


def _get_file_list(filename: str = None, directory: str = None, extension: str = None, **_) -> List[str]:
    filename = filename if filename else "*"
    path = Path(directory if directory else "")
    extension = extension if extension else ".py"

    # Clean our inputs
    if filename.endswith(extension):
        filename = filename[:-3]

    return glob.glob("{0}/**/{1}{2}".format(path.as_posix(), filename, extension), recursive=True)


def _run_format(file_list: List[str], check: bool = False):
    command = ["black", "--config", "pyproject.toml"]
    if check:
        command.append("--check")
    return call(command + file_list)


def _run_tests(test_log_level: str, name: Optional[str]) -> int:
    # run in Verbose mode and ignore deprecation warnings
    args = ["-vv", "-W", "ignore::DeprecationWarning",
            "--log-cli-level", test_log_level]
    if name:
        args.append(name)

    results = pytest.main(args)
    return results


def _run_mypy(file_list: List[str]):
    return call(["mypy", "--config-file=.mypy.ini", *file_list])


def _run_pylint(file_list: List[str]):
    pylint_opts = ["--rcfile=.pylintrc", "--disable=fixme"]
    pylint.lint.Run(pylint_opts + file_list)


def _run_pycodestyle(file_list: List[str]):
    style_guide = StyleGuide(paths=file_list, config_file=".pycodestyle")
    report = style_guide.check_files()

    if report.total_errors:
        sys.stderr.write(str(report.total_errors) + "\n")
        sys.exit(1)


def _run_linting(file_list: List[str], pylint_only: bool = False, pycodestyle_only: bool = False, **_):
    # NOTE obviously nothing will run if both are true
    if not pylint_only:
        _run_pycodestyle(file_list)
    if not pycodestyle_only:
        _run_pylint(file_list)


@click.group()
@click.option("--log-level", required=False, default="INFO", help="Set the log level.")
def main(**kwargs):
    return


@main.command()
@click.option("--test-log-level", default="WARNING", help="Log level for the test run.")
@click.option("--name", required=False, help="The name of the specific test to run.")
def test(**kwargs):
    """Run unit tests."""
    sys.exit(_run_tests(kwargs["test_log_level"], kwargs.get("name")))


@main.command()
@click.option("--check", is_flag=True, help="Check formatting, but don't apply changes.")
@click.option("--filename", required=False, help="The name or glob regex for the file(s) to format.")
@click.option("--directory", required=False, help="The directory for the file(s) to format.")
def formatting(**kwargs):
    """Run Black formatter."""
    file_list = _get_file_list(**kwargs)
    if not file_list:
        sys.exit(0)
    sys.exit(_run_format(file_list=file_list, check=kwargs["check"]))


@main.command()
@click.option("--filename", required=False, help="The name or glob regex for the file(s) to lint.")
@click.option("--directory", required=False, help="The directory for the file(s) to lint.")
@click.option("--pylint", is_flag=True, help="Run only pylint.")
@click.option("--pycodestyle", is_flag=True, help="Run only pycodestyle.")
def lint(**kwargs):
    """Run linting."""
    config = {k: v for k, v in kwargs.items(
    ) if k not in ("pylint", "pycodestyle")}
    config["pycodestyle_only"] = kwargs["pycodestyle"]
    config["pylint_only"] = kwargs["pylint"]

    file_list = _get_file_list(**kwargs)
    if not file_list:
        sys.exit(0)

    # NOTE pylint should handle sys.exit and error codes, itself.
    _run_linting(file_list=file_list, **kwargs)


@main.command()
@click.option("--filename", required=False, help="The name or glob regex for the file(s) to typecheck.")
@click.option("--directory", required=False, help="The directory for the file(s) to typecheck.")
def typecheck(**kwargs):
    """Run static type-checking."""
    # NOTE mypy should handle sys.exit and error codes, itself.
    file_list = _get_file_list(**kwargs)
    if not file_list:
        sys.exit(0)
    _run_mypy(file_list=file_list)


if __name__ == "__main__":
    main()
